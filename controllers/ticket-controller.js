const Ticket = require("../models/Ticket");
const Agency = require("../models/Agency");
// const moment = require("moment");
const moment = require('moment-timezone');
const User = require("../models/User");
const Line = require("../models/Line");
const TicketService = require("../services/ticketService");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const City = require("../models/City");
const cron = require("cron");


const findTime = (ticket, from, to) => {
  const stop = ticket?.stops?.find(
    (s) =>
      s.from.some((cityInfo) => cityInfo.code === from) &&
      s.to.some((t) => t.code === to)
  );
  if (stop) {
    return stop.time;
  } else {
    return "Time not found";
  }
};

const findTimestamp = (ticket, from, to) => {
  const stop = ticket?.stops?.find(
    (s) =>
      s.from.some((cityInfo) => cityInfo.code === from) &&
      s.to.some((t) => t.code === to)
  );
  if (stop) {
    return stop.timestamp;
  } else {
    return "Time not found";
  }
};

const findMAxBuyingTime = (ticket, from, to) => {
  const stop = ticket?.stops?.find(
    (s) =>
      s.from.some((cityInfo) => cityInfo.code === from) &&
      s.to.some((t) => t.code === to)
  );
  if (stop) {
    return stop.maxBuyingTime;
  } else {
    return "Time not found";
  }
};

const findDate = (ticket, from, to) => {
  const stop = ticket.stops.find(
    (s) =>
      s.from.some((cityInfo) => cityInfo.code === from) &&
      s.to.some((t) => t.code === to)
  );
  if (stop) {
    return stop.date;
  } else {
    return "Date not found";
  }
};

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
          const all = await Ticket.find({})
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
          const allLineIDS = req.query.line.split('-').filter(Boolean);
      
          const allBookings = await Booking.find({ });
          const ticketsWithBookings = [];
      
          for (const line of allLineIDS) {
            const line_id = new mongoose.Types.ObjectId(line);
      
            const ticketQuery = {
              date: { $gte: startDate, $lte: endDate },
              lineCode: line_id,
            };
      
            const ticketsForLine = await Ticket.find(ticketQuery)
              .populate('lineCode')
              .sort({ date: 'asc' });
      
            const ticketsForLineWithBookings = ticketsForLine.map((ticket) => {
              const bookingsForTicket = allBookings.filter(
                (booking) => booking.ticket.toString() === ticket._id.toString()
              );
              return {
                ticket,
                bookings: bookingsForTicket,
              };
            });
      
            ticketsWithBookings.push(...ticketsForLineWithBookings);
          }
      
          ticketsWithBookings.sort((a, b) => new Date(a.ticket.date) - new Date(b.ticket.date));
          res.status(200).json(ticketsWithBookings);
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: `Internal error -> ${error}` });
        }
      },

      getSearchedTickets: async (req,res) => {
        try {
          let page = Number(req.query.page) || 1;
          let size = Number(req.query.size) || 8;
          const skipCount = (page - 1) * size;
      
          const europeBerlinTimezone = 'Europe/Berlin';
          const currentDateFormatted = moment().tz(europeBerlinTimezone).startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
          const currentTimeFormatted = moment().tz(europeBerlinTimezone).format('HH:mm');
          
          console.log({ currentDateFormatted });
      
          // const distinctTicketIds = await Ticket.distinct('_id', {
          //   $or: [
          //     {
          //       'stops.from.code': req.query.from,
          //       'stops.to.code': req.query.to,
          //     }
          //   ]
          // });
      
          const uniqueTickets = await Ticket.aggregate([
            {
              $match: {
                'stops.from.code': req.query.from,
                'stops.to.code': req.query.to,
                date: { $gte: currentDateFormatted },
                numberOfTickets: { $gt: 0 },
                isActive: true
              }
            },
            {
              $project: {
                _id: 1,
                lineCode: 1,
                from: 1,
                to: 1,
                date: 1,
                time: 1,
                type: 1,
                numberOfTickets: 1,
                isActive: 1,
                stops: {
                  $filter: {
                    input: '$stops',
                    as: 'stop',
                    cond: {
                      $and: [
                        { $anyElementTrue: { $map: { input: '$$stop.from', as: 'from', in: { $eq: ['$$from.code', req.query.from] } } } },
                        { $anyElementTrue: { $map: { input: '$$stop.to', as: 'to', in: { $eq: ['$$to.code', req.query.to] } } } }
                      ]
                    }
                  }
                }
              }
            },
            {
              $sort: { date: 1 },
            },
            {
              $skip: skipCount,
            },
            {
              $limit: size,
            }
          ]);
      
          const filteredTickets = uniqueTickets.filter((ticket) => {
            const ticketDateTime = moment(`${findDate(ticket, req.query.from, req.query.to)} ${findTime(ticket, req.query.from, req.query.to)}`, 'YYYY-MM-DD HH:mm');
            const currentDateTime = moment(`${currentDateFormatted} ${currentTimeFormatted}`, 'YYYY-MM-DD HH:mm').tz(europeBerlinTimezone);
        
            return currentDateTime.isAfter(ticketDateTime);
        });
      
          const remainingTickets = uniqueTickets.filter((ticket) => !filteredTickets.includes(ticket));
      
          if (remainingTickets.length === 0) {
            return res.status(204).json("no routes found");
          }
      
          return res.status(200).json(remainingTickets);
        } catch (error) {
          console.error(error);
          return res.status(500).json({ message: "Internal error -> " + error });
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
          res.status(200).json({ message: "Linja u fshij me sukses"});
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

const generateTicketsForNextTwoYears = async (ticketData, selectedDaysOfWeek) => {
  const adjustDayOfWeek = (startDate, dayOfWeek) => {
    const adjustedDate = new Date(startDate);
    adjustedDate.setDate(startDate.getDate() + ((dayOfWeek + 6 - startDate.getDay()) % 7));
    return adjustedDate;
  };

  const tickets = [];


  for (const selectedDayOfWeek of selectedDaysOfWeek) {
    const frankfurtTimezone = 'Europe/Berlin';
    const startDateString = new Date().toLocaleString('en-US', { timeZone: frankfurtTimezone });
    const startDate = new Date(startDateString);
    
    let ticketDate = adjustDayOfWeek(startDate, selectedDayOfWeek);

    for (let i = 0; i < 2 * 52; i++) {
      const ticketDateString = ticketDate.toISOString();

      const ticketDataWithDate = {
        ...ticketData,
        date: ticketDateString,
      };

      const stopsWithTime = ticketDataWithDate.stops.map((stop) => {
        const stopDate = new Date(ticketDateString);
        const maxBuyingTime = new Date(stopDate);
        const hour = stop.time.split(":")[0];
        const minute = stop.time.split(":")[1];
        stopDate.setHours(parseInt(hour) + 1, parseInt(minute), 0, 0);
        mbHours = stop.maxBuyingTime.split(':')[0];
        mbMins = stop.maxBuyingTime.split(':')[1];
        maxBuyingTime.setHours(parseInt(mbHours) + 1, mbMins, 0, 0);


        if (stop.isTomorrow) {
          stopDate.setDate(stopDate.getDate() + 1);
        }

        let arrivalTimeHours = 0;
        let arrivalTimeMinutes = 0;
        let arrivalTimeDate;
        
        if (stop.arrivalTime.includes(':')) {
          arrivalTimeHours = stop.arrivalTime.split(":")[0];
          arrivalTimeMinutes = stop.arrivalTime.split(":")[1];
        } else {
            arrivalTimeHours = parseInt(stop.arrivalTime);
            arrivalTimeMinutes = 0;
        }
        
        const arrivalTimeMilliseconds = arrivalTimeHours * 60 * 60 * 1000 + arrivalTimeMinutes * 60 * 1000;
        arrivalTimeDate = new Date(stopDate.getTime() + arrivalTimeMilliseconds);

        return {
          ...stop,
          time: stop.time,
          date: stopDate.toISOString(),
          arrivalTimestamp: arrivalTimeDate,
          maxBuyingTime: stop.maxBuyingTime
        };
      });

      const ticketWithStops = {
        ...ticketDataWithDate,
        stops: stopsWithTime,
      };

      tickets.push(ticketWithStops);
      console.log({ticket: JSON.stringify(ticketWithStops, null, 2)})

      ticketDate.setDate(ticketDate.getDate() + 7);
    }
  }

  await Ticket.insertMany(tickets);
  
  return tickets;
};

