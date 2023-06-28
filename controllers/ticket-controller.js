const Ticket = require("../models/Ticket");
const Agency = require("../models/Agency");
const moment = require("moment");
const User = require("../models/User");
const jwt = require("jsonwebtoken");


module.exports = {

    registerTicket: async (req, res) => {
        try {
          
          const agencyID = req.params.agencyID;
    
          const newTicket = new Ticket({
            from: req.body.from,
            to: req.body.to,
            date: req.body.date,
            returnDate: req.body.returnDate,
            time: req.body.from,
            arrivalTime: req.body.arrivalTime,
            returnArrivalDate: req.body.returnArrivalDate,
            arrivalDate: req.body.arrivalDate,
            returnArrivalTime: req.body.returnArrivalTime,
            returnTime: req.body.returnTime,
            type: req.body.type,
            numberOfTickets: req.body.numberOfTickets,
            price: req.body.price,
            childrenPrice: req.body.childrenPrice,
            agency: agencyID,
            startLng: req.body.startLng,
            startLat: req.body.startLat,
            endLng: req.body.endLng,
            endLat: req.body.endLat,
          });
    
          await newTicket.save();
          res.status(200).json(newTicket);
        } catch (error) {
          res.status(500).json({ message: "Internal error -> " + error });
        }
      },
    
      getSingleTicket: async (req,res)=>{ 
        try {
            const ticket = await Ticket.findById(req.params.id);
            if(!ticket) {
                return res.status(404).json({ message: "Ticket not found" });
            }
            res.status(200).json(ticket);
        } catch (error) {
          res.status(500).json({ message: "Internal error -> " + error });
        }
      },
      
      getAllTicket: async (req,res)=>{ 
        try {
          const page= req.query.page || 0;
          const size= req.query.size || 10;
          const all = await Ticket.find({})

            const allTickets = await Ticket.find({}).skip(page*size).limit(size).populate('agency');
            res.status(200).json({allTickets,all:all.length});
        } catch (error) {
          console.log(error)
          res.status(500).json({ message: "Internal error -> " + error });
        }
      },

      getSearchedTickets: async (req, res) => {
        try {
          // console.log(req.connection.remoteAddress)
          // const authHeader = req.headers.authorization;
    
          // let user;
          // if (authHeader) {
          //   const token = authHeader.split(' ')[1];
          //   let decoded;
          //   decoded = jwt.verify(token, process.env.OUR_SECRET);
          //   user = decoded.data;
          //   const searchedFrom = req.query.from.toLowerCase();
    
          //   if (searchedFrom && user && !user.searched.includes(searchedFrom)) {
          //     await User.findByIdAndUpdate(user._id, { $push: { searched: searchedFrom } });
          //   }
          // }
    
          let from = req.query.from;
          let to = req.query.to;
          let date = req.query.date;
          let returnDate = req.query.returnDate;
          let type = req.query.type;
          let price = req.body.price;
          let childrenPrice = req.body.childrenPrice;

          const searchParams = {};
    
          if (from) searchParams.from = from;
          if (to) searchParams.to = to;
          if (date) searchParams.date = date;
          if (returnDate) searchParams.returnDate = returnDate;
          if (type) searchParams.type = type;
          if (price) searchParams.price = price;
          if (childrenPrice) searchParams.childrenPrice = childrenPrice;
    
          const searchFields = ['from', 'to', 'type'];
          const textQuery = searchFields
            .filter((field) => searchParams[field])
            .map((field) => ({
              [field]: { $regex: searchParams[field], $options: 'i' },
            }));
          const ticketQuery = textQuery.length > 0 ? { $or: textQuery } : {};
    
          const allTickets = await Ticket.find({
            ...ticketQuery,
            ...searchParams,
            // createdAt: {$gte:new Date().getTime()}
          })      
            .populate('agency')
            .sort({ createdAt: 'desc' });
          res.status(200).json(allTickets);
        } catch (error) {
          console.error(error);
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
          const ticket = await Ticket.findById(req.params.id);
    
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
          res.status(500).json("error -> " + error);
        }
      },

}