const Ticket = require("../models/Ticket");
const Agency = require("../models/Agency");
const moment = require("moment");
const User = require("../models/User");
const Line = require("../models/Line");
const TicketService = require("../services/ticketService");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const City = require("../models/City");
const cron = require("cron");

module.exports = {

  registerTicket: async (req, res) => {
    try {
      const selectedDayOfTheWeek = req.body.dayOfWeek;
      const line = await Line.findById(req.body.lineCode);
      console.log({ selectedDayOfTheWeek })
      const ticketData = {
        lineCode: req.body.lineCode,
        time: req.body.time,
        numberOfTickets: 48,
        from: line.from,
        to: line.to,
        stops: req.body.stops,
      };
  
      console.log({ body: JSON.stringify(req.body, null, 2) })
      // console.log({stops: JSON.stringify(req.body.stops, null, 2)})
  
      const generatedTickets = await generateTicketsForNextTwoYears(ticketData || req.body.ticketData, selectedDayOfTheWeek || req.body.selectedDayOfTheWeek);
  
      res.status(200).json({
        generatedTickets,
      });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Internal error -> " + error });
    }
  },
    
    getTicketById: async (req,res) => {
      try {
        console.log("i hini");
        const ticket = await Ticket.findById(req.params.id);
        res.status(200).json(ticket);
      } catch (error) {
        res.status(500).json(error)
      }
    },

    getSingleTicket: async (req, res)=>{ 
      try {
          const ticket = await Ticket.aggregate([
            {
              $match: {
                _id: new mongoose.Types.ObjectId(req.params.id)
              }
            },
            {
              $lookup: {
                from: 'lines',
                localField: 'lineCode',
                foreignField: '_id',
                as: 'lineCode'
              }
            },
            {
              $unwind: {
                path: '$lineCode',
                preserveNullAndEmptyArrays: true
              }
            },
          ])

          
          if(ticket.length < 1) {
              return res.status(404).json("Bileta nuk u gjet. Provoni perseri!");
          }

          res.status(200).json(ticket[0]);
      } catch (error) {
        res.status(500).json({ message: "Internal error -> " + error });
      }
    },
      
      getAllTicket: async (req,res) => {
        try {
          const all = await Ticket.find({}).populate('lineCode')
          res.status(200).json(all)
        } catch (error) {
          res.status(500).json({ message: "Internal error -> " + error });
        }
      },

      getAll: async (req,res) => {
        try {
          const today = moment().format('DD-MM-YYYY');
          const all = await Ticket.find({ date: { $gte: today } });
  
          res.status(200).json(all);
        } catch (error) {
          res.status(500).json({ message: "Internal error -> " + error });
          
        }
      },

      getAllTicketPagination: async (req,res)=>{ 
        try {
          const page = req.query.page || 0;
          const size = req.query.size || 10;
          const all = await Ticket.find({})
          const today = moment().format('DD-MM-YYYY');

            const allTickets = await Ticket.find({}).populate('lineCode').sort({createdAt: 'desc'})
            console.log(today)
            res.status(200).json({allTickets,all:all.length});
        } catch (error) {
          console.log(error)
          res.status(500).json({ message: "Internal error -> " + error });
        }
      },

      getTicketLinesBasedOnDate: async (req, res) => {
        try {
          const startDate = req.query.startDate;
          const endDate = req.query.endDate;
          const allBookings = await Booking.find({});
          console.log({ line: req.query.line });
          const allLineIDS = req.query.line.split('-');
      
          let ticketsWithStops = [];
      
          for (const line of allLineIDS) {
            if (line !== "") {
              const line_id = new mongoose.Types.ObjectId(line);
              console.log(line_id);
      
              const ticketQuery = {
                'stops.dates': { $gte: startDate, $lte: endDate },
                lineCode: line_id,
              };
      
              const ticketsForLine = await Ticket.find(ticketQuery)
                .populate('lineCode')
                .sort({ date: 'asc' });
      
              const ticketsForLineWithStops = await Promise.all(ticketsForLine.map(async (ticket) => {
                const stopsForTicket = await Promise.all(ticket.stops.map(async (stop) => {
                  const fromCity = ticket.from;
                  const toCity = ticket.to;
                  const times = stop.times;
                  const dates = stop.dates;
      
                  // Create a separate ticket for each date and time
                  const ticketsForDateAndTime = await Promise.all(dates.map(async (date) => {
                    const bookingsForTicket = allBookings.filter((booking) =>
                      booking.ticket.toString() === ticket._id.toString() &&
                      booking.from === fromCity && booking.to === toCity &&
                      booking.date === date && times.includes(booking.time)
                    );
      
                    const passengersForBookings = bookingsForTicket.map((booking) => booking.passengers.length);
      
                    return {
                      ticket: {
                        ...ticket.toObject(),
                        date: date,
                        time: times,
                      },
                      stop: {
                        from: fromCity,
                        to: toCity,
                        time: times,
                        date: date,
                        price: stop.price,
                        lineCode: ticket?.lineCode?.code,
                      },
                      numberOfBookings: bookingsForTicket.length,
                      totalPassengers: passengersForBookings.reduce((acc, curr) => acc + curr, 0),
                    };
                  }));
      
                  // Flatten the array of arrays into a single array
                  return [].concat(...ticketsForDateAndTime);
                }));
      
                // Flatten the array of arrays into a single array
                return [].concat(...stopsForTicket);
              }));
      
              ticketsWithStops.push(...ticketsForLineWithStops);
            }
          }
      
          // Flatten the array of arrays into a single array
          ticketsWithStops = [].concat(...ticketsWithStops);
      
          // Sort the tickets by stops.date
          // ticketsWithStops.sort((a, b) => new Date(a.stop.date) - new Date(b.stop.date) || a.ticket.time.localeCompare(b.ticket.time));
      
          res.status(200).json(ticketsWithStops);
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Internal error -> " + error });
        }
      },
      
      
      
      

      getSearchedTickets: async (req, res) => {
        try {
          let page = Number(req.query.page) || 1;
          let size = Number(15);
          const skipCount = (page - 1) * size;
      
          console.log({page, size, skipCount})

          const from = req.query.from;
          const to = req.query.to;
          const cities = await City.find({
            $or: [
              {
                name: req.query.from,
              },
              {
                name: req.query.to,
              },
            ],
          });
          console.log({ from, to });
          const haveCountries = cities[0]?.country == '' && cities[1]?.country == '';
      
          if (cities[0]?.country == cities[1]?.country) {
            return res.status(404).json('No tickets found for your chosen locations!');
          }
          const currentDateFormatted = moment(new Date()).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
      
          const distinctStops = await Ticket.aggregate([
            {
              $match: {
                date: { $gte: currentDateFormatted },
                numberOfTickets: { $gt: 0 },
                'stops.from.city': req.query.from,
                'stops.to.city': req.query.to,
              },
            },
            {
              $unwind: '$stops',
            },
            {
              $group: {
                _id: '$_id',
                lineCode: { $first: '$lineCode' },
                from: { $first: '$stops.from' }, 
                to: { $last: '$stops.to' },
                dates: { $first: '$stops.dates' },
                times: { $first: '$stops.times' },
                price: { $first: '$stops.price' },
                childrenPrice: { $first: '$stops.childrenPrice' },
                numberOfTickets: { $first: '$numberOfTickets' },
                isActive: { $first: '$isActive' },
                createdAt: { $first: '$createdAt' },
                updatedAt: { $first: '$updatedAt' },
              },
            },
            {
              $unwind: '$dates',
            },
            {
              $unwind: '$times',
            },
            {
              $sort: { dates: 1, times: 1 },
            },
            {
              $skip: skipCount,
            },
            {
              $limit: size,
            },
          ]);
      
      
          if (distinctStops.length == 0) {
            return res.status(204).json('No stops found');
          }
      
          const formattedStops = distinctStops.map(stop => ({
            _id: stop._id,
            lineCode: stop.lineCode,
            from: stop.from,
            price: stop.price,
            childrenPrice: stop.childrenPrice,
            to: stop.to,
            dates: stop.dates,
            times: stop.times,
            numberOfTickets: stop.numberOfTickets,
            isActive: stop.isActive,
            createdAt: stop.createdAt,
            updatedAt: stop.updatedAt,
          }));
      
          return res.status(200).json(formattedStops);
        } catch (error) {
          console.error(error);
          return res.status(500).json({ error: 'Internal server error' + error });
        }
      },
      
 


      getNearestTicket: async (req, res) => {
        try {
          const dateNow = moment().format('DD-MM-YYYY');
          const ticket = await Ticket.find({
            from: req.query.from,
            to: req.query.to,
            date: { $gte: dateNow },
          })
            .populate([
              // { path: 'agency', select: '-password', match: { isActive: true } },
              { path: 'lineCode' },
            ])

          if (ticket) {
            res.status(200).json(ticket); 
          } else {
            res.status(404).json({ message: 'No nearest ticket found.' }); 
          }
        } catch (error) {
          res.status(500).json({ message: 'Internal server error -> ' + error });
        }
      },

      deleteTicket: async (req, res) => {
        try {
          const deleteTicket = await Ticket.findByIdAndRemove(req.params.id);
          res.status(200).json({ message: "ticket deleted successfully ->  " + deleteTicket });
        } catch (error) {
          console.error(error);
          res.status(500).json("error -> " + error);
        }
      },

      editTicket: async (req, res) => {
        try {
          console.log(req.params.id)
          const ticket = await Ticket.findById(req.params.id);

          if (!ticket) {
            return res.status(404).json("Ticket not found");
          }
      
          const editTicket = {
            from: req.body.from ? req.body.from : ticket.from,
            to: req.body.to ? req.body.to : ticket.to,
            date: req.body.date ? req.body.date : ticket.date,
            time: req.body.time ? req.body.time : ticket.time,
            returnDate: req.body.returnDate ? req.body.returnDate : ticket.returnDate,
            returnTime: req.body.returnTime ? req.body.returnTime : ticket.returnTime,
            numberOfTickets: req.body.numberOfTickets ? req.body.numberOfTickets : ticket.numberOfTickets,
            price: req.body.price ? req.body.price : ticket.price,
            childrenPrice: req.body.childrenPrice ? req.body.childrenPrice : ticket.childrenPrice,
            agency: ticket.agency,
            type: req.body.type ? req.body.type : ticket.type,
          }
      
          const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, editTicket);
          res.status(200).json(updatedTicket);
      
        } catch (error) {
          res.status(500).json("Error -> " + error);
        }
      },

      stopSales: async (req,res) => {
          try {
            const deactivated = await Ticket.findByIdAndUpdate(req.params.id, { $set: { isActive: false } })
            res.status(200).json(deactivated );
          } catch (error) {
              res.status(500).json("Error -> " + error);
          }
      },

      allowSales: async (req,res) => {
          try {
            const deactivated = await Ticket.findByIdAndUpdate(req.params.id, { $set: { isActive: true } })
            res.status(200).json(deactivated );
          } catch (error) {
              res.status(500).json("Error -> " + error);
          }
      },

      updateSeats: async (req,res)=> {
        try {
          const newNumberOfTickets = req.body.newNumberOfTickets;
          await Ticket.findByIdAndUpdate(req.params.id, { $set: { numberOfTickets: newNumberOfTickets } })
          res.status(200).json("updated nr. tickets");
        } catch (error) {
          res.status(500).json("Error -> " + error);
        }
      },

      updateReturnSeats: async (req,res)=> {
        try {
          const newNumberOfReturnTickets = req.body.newNumberOfReturnTickets;
          await Ticket.findByIdAndUpdate(req.params.id, { $set: { numberOfReturnTickets: newNumberOfReturnTickets } })
          res.status(200).json("updated nr. tickets");
        } catch (error) {
          res.status(500).json("Error -> " + error);
        }
      },

}


const generateTicketsForNextTwoYears = async (ticketData, selectedDayOfWeeks) => {
  const adjustDayOfWeek = (startDate, dayOfWeek) => {
    const adjustedDate = new Date(startDate);
    adjustedDate.setDate(startDate.getDate() + ((dayOfWeek + 6 - startDate.getDay()) % 7));
    return adjustedDate;
  };

  const startDate = new Date();
  const tickets = [];

  for (let i = 0; i < 2 * 52; i++) {
    const ticketDate = new Date(startDate);
    startDate.setDate(startDate.getDate() + 6);

    const ticketDateString = ticketDate.toISOString();

    const stopsWithDates = ticketData.stops.map((stop) => {
      const stopDates = stop.dayOfWeek.map((dayOfWeek) => {
        const stopDate = adjustDayOfWeek(new Date(ticketDate), dayOfWeek);
        return stopDate.toISOString();
      });

      return {
        ...stop,
        dates: stopDates,
      };
    });

    const ticketDataWithDates = {
      ...ticketData,
      date: ticketDateString,
      stops: stopsWithDates,
    };

    tickets.push(ticketDataWithDates);
  }

  await Ticket.insertMany(tickets);

  return tickets;
};



