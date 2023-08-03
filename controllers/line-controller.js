const Booking = require("../models/Booking");
const Line = require("../models/Line");
const Ticket = require("../models/Ticket");
const moment = require('moment')

module.exports = {

    createLine: async (req,res) => {
        try {
            const newLine = new Line({
                code: req.body.code,
                from: req.body.from,
                to: req.body.to,
                lat: req.body.lat,
                lng: req.body.lng,
                endLat: req.body.endLat,
                endLng: req.body.endLng,
            })

            console.log(req.body)

            await newLine.save();
            res.status(200).json("New line created!" + newLine);

        } catch (error) {
            res.status(500).json(error);
        }
    },    

    getAllLines: async (req,res) => {
      try {
        const all = await Line.find({});
        res.status(200).json(all);
      } catch (error) {
        res.status(500).json(error);
      }
    },


    getLineBookings: async (req, res) => {
      try {
        const lines = await Line.find({});
        const bookingsForLine = await Booking.find({})
          .populate({
            path: 'ticket',
            populate: { path: 'lineCode' },
          })
          .populate('buyer')
          .sort({ createdAt: 'desc' });
    
        const lineBookings = lines.map((line) => {
          const bookings = bookingsForLine.filter((booking) => line.code === booking.ticket.lineCode.code);
          const todaysBookings = bookings.filter((b) => b.ticket.date === moment().format('DD-MM-YYYY') || b.ticket.returnDate === moment().format('DD-MM-YYYY'))
    
          return {
            line: line.code,
            from: line.from,
            to: line.to,
            bookings: bookings,
          };
        });
    
        res.status(200).json(lineBookings);
      } catch (error) {
        res.status(500).json('error -> ' + error);
      }
    },
    
    
    findTodaysLineTickets: async (req,res) => {
      try {
        const lines = await Line.find({});
        const bookingsForLine = await Booking.find({})
          .populate({
            path: 'ticket',
            populate: { path: 'lineCode' },
          })
          .populate('buyer')
          .sort({ createdAt: 'desc' });
    
        const lineBookings = lines.map((line) => {
          const bookings = bookingsForLine.filter((booking) => line.code === booking.ticket.lineCode.code);
          const todaysBookings = bookings.filter((b) => b?.ticket?.date === moment(new Date()).format('DD-MM-YYYY') || b?.ticket?.returnDate === moment().format('DD-MM-YYYY'))
    
          return {
            line: line.code,
            from: line.from,
            to: line.to,
            bookings: todaysBookings,
          };
        });
    
        res.status(200).json(lineBookings);
      } catch (error) {
        res.status(500).json('error -> ' + error);
      }
     
     
     
      // try {
      //   let todayDate = moment().format('DD-MM-YYYY');
      //   console.log(todayDate)
      //   const tickets = await Ticket.find({ date: { $gte: '02-08-2023', $lte: '02-08-2023' } }).populate('lineCode');
      //   res.status(200).json(tickets);
      // } catch (error) {
      //   res.status(500).json("error -> " + error)
      // }
    },

      getSingleLineBookings: async (req,res) =>{
        try {
          const bookingsForLine = await Booking.find({}).populate({
            path: 'ticket',
            populate: { path: 'lineCode' }
          }).populate({
            path: 'buyer',
            select: '-password'
          }).sort({createdAt: 'desc'})
          
          var bookings = [];
      
          for (const booking of bookingsForLine) {
            if (booking.ticket.lineCode._id == req.params.id && (booking.ticket.date == req.params.from || booking.ticket.returnDate == req.params.from)) {
              bookings.push(booking);
              console.log(booking)
            }
          }

          console.log(bookings)
          res.status(200).json(bookings);
        } catch (error) {
          res.status(500).json(error);
        }
      },

      deleteLine: async (req,res) => {
        try {
            const deletedLine = await Line.findByIdAndRemove(req.params.id);
            res.status(200).json(deletedLine);
        } catch (error) {
            res.status(500).json(error);
        }
      },


}