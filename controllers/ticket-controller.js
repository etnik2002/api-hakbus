const Ticket = require("../models/Ticket");
const Agency = require("../models/Agency");
const moment = require("moment");
const User = require("../models/User");
const Line = require("../models/Line");
const TicketService = require("../services/ticketService");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

module.exports = {

    registerTicket: async (req, res) => {
      try {
        const selectedDayOfTheWeek = Number(req.body.dayOfWeek);
        const selectedReturnDayOfWeek = Number(req.body.returnDayOfWeek);
        const line = await Line.findById(req.body.lineCode);

        const ticketData = {
          lineCode: req.body.lineCode,
          time: req.body.time,
          returnTime: req.body.returnTime,
          numberOfTickets: req.body.numberOfTickets,
          numberOfReturnTickets: req.body.numberOfReturnTickets,
          price: req.body.price,
          childrenPrice: req.body.childrenPrice,
          changes: req.body.changes,
          from: line.from,
          to: line.to,
        };
    
        const generatedTickets = await generateTicketsForNextTwoYears(ticketData || req.body.ticketData, selectedDayOfTheWeek || req.body.selectedDayOfTheWeek, selectedReturnDayOfWeek || req.body.selectedReturnDayOfWeek);
    
        res.status(200).json({
          generatedTickets,
        });
      } catch (error) {
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

          
        if(!ticket) {
              return res.status(404).json({ message: "Ticket not found" });
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
          console.log('holl')
          const today = moment().format('DD-MM-YYYY');
          const tomorrow = moment().add(1, 'day').format('DD-MM-YYYY');
          const allBookings = await Booking.find({});
      
          const fromDate = req.query.from || today;
          const toDate = req.query.to || tomorrow;
      
          const ticketQuery = {
            date: { $gte: fromDate, $lte: fromDate }
          };
          
          console.log(today,fromDate)
          const allTickets = await Ticket.find(ticketQuery)
            .populate('lineCode')
            .sort({ createdAt: 'desc' });
      
          const ticketsWithBookings = allTickets.map(ticket => {
            const bookingsForTicket = allBookings.filter(booking => booking.ticket.toString() === ticket._id.toString());
            return {
              ticket: ticket,
              bookings: bookingsForTicket
            };
          });
      
          res.status(200).json(ticketsWithBookings);
        } catch (error) {
          console.log(error);
          res.status(500).json({ message: "Internal error -> " + error });
        }
      },

      getSearchedTickets: async (req, res) => {
        try {
            let from = req.query.from;
            let to = req.query.to;
            let returnDate = req.query.returnDate;
            let type = req.query.type;
            let price = req.body.price;
            let childrenPrice = req.body.childrenPrice;
            const dateNow = moment().format('DD-MM-YYYY'); 
            
            // const tickets = await Ticket.find({
            //   $or: [
            //     { from: req.query.from, to: req.query.to, date: { $gte: dateNow } },
            //     { from: req.query.to, to: req.query.from, date: { $gte: dateNow } }
            //   ]
            // }).populate('lineCode');
            

            // if(tickets) {
            //   const found =tickets.filter((t) => t.date >= dateNow)
            //   return res.status(200).json(found);
            // }
        
            const searchParams = {};
        
            if (type) searchParams.type = type;
            if (price) searchParams.price = price;
            if (childrenPrice) searchParams.childrenPrice = childrenPrice;
            if (from) searchParams.from = from;
            if (to) searchParams.to = to;
        
            const searchFields = ['date', 'from', 'to'];
            const textQuery = searchFields
              .filter((field) => searchParams[field])
              .map((field) => ({
                [field]: { $regex: searchParams[field], $options: 'i' },
              }));
            const ticketQuery = textQuery.length > 0 ? { $or: textQuery } : {};
        
            const allTickets = await Ticket.find({
              ...ticketQuery,
              ...searchParams,
              date: { $gte: dateNow },
            })
              .populate({
                path: 'lineCode',
                match: { 'from': { $regex: new RegExp('^' + from, 'i') }, 'to': { $regex: new RegExp('^' + to, 'i') } },
              });
        
              
            const filteredTickets = allTickets.filter((ticket) => ticket.lineCode && ticket.date >= dateNow);
            
            filteredTickets.sort((a, b) => new Date(a.date) - new Date(b.date));
        
            res.status(200).json(filteredTickets);
        } catch (error) {
          res.status(500).json({ message: 'Internal server error -> ' + error });
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


const generateTicketsForNextTwoYears = async (ticketData, selectedDayOfWeek, selectedReturnDayOfWeek) => {
  const adjustDayOfWeek = (startDate, dayOfWeek) => {
    const adjustedDate = new Date(startDate);
    adjustedDate.setDate(startDate.getDate() + ((dayOfWeek + 7 - startDate.getDay()) % 7));
    return adjustedDate;
  };

  if (selectedReturnDayOfWeek < selectedDayOfWeek) {
    selectedReturnDayOfWeek = (selectedReturnDayOfWeek % 7) + 1;
  }

  const startDate = new Date();
  const ticketDate = adjustDayOfWeek(startDate, selectedDayOfWeek);
  startDate.setDate(ticketDate.getDate());
  startDate.setHours(8, 0, 0, 0);

  const returnDate = adjustDayOfWeek(ticketDate, selectedReturnDayOfWeek);

  const tickets = [];

  for (let i = 0; i < 2*52 ; i++) {
    const ticketDateString = moment(ticketDate).subtract(1, 'days').format('DD-MM-YYYY');
    const returnTicketDateString = moment(returnDate).subtract(1, 'days').format('DD-MM-YYYY');

    const ticketDataWithDate = {
      ...ticketData,
      date: ticketDateString,
      returnDate: returnTicketDateString,
    };

    const ticket = new Ticket(ticketDataWithDate);
    ticket.date = ticketDateString;
    ticket.returnDate = returnTicketDateString;

    await ticket.save();
    tickets.push(ticket);

    ticketDate.setDate(ticketDate.getDate() + 7);
    returnDate.setDate(returnDate.getDate() + 7);
  }

  console.log({ tickets });
  return tickets;
};


