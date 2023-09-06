const Booking = require("../models/Booking");
const Line = require("../models/Line");
const Ticket = require("../models/Ticket");
const moment = require('moment')
const mongoose = require("mongoose")

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

    getAllLines: async (req, res) => {
      try {
        const all = await Line.aggregate([{ $match: {} }]).exec();
        res.status(200).json(all);
      } catch (error) {
        res.status(500).json("error " + error);
      }
    },  


    getLineBookings: async (req, res) => {
      try {
        const lines = await Line.aggregate([{ $match: {} }])
        console.log({lines})
        const bookingsForLine = await Booking.find({})
        .populate({
          path: 'ticket',
          model: 'Ticket', 
          populate: {
            path: 'lineCode',
            model: 'Line', 
          },
        })
        .populate({
          path: 'buyer',
          model: 'User', 
        })
        .sort({ createdAt: -1 })

        const lineBookings = lines.map((line) => {
          const bookings = bookingsForLine.filter((booking) => line.code === booking.ticket.lineCode.code);
          const todaysBookings = bookings.filter((b) => b.ticket.date === moment().format('DD-MM-YYYY') || b.ticket.returnDate === moment().format('DD-MM-YYYY'));
    
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
        const lines = await Line.aggregate([{ $match: {} }])


        const bookingsForLine = await Booking.find({})
        .populate({
          path: 'ticket',
          model: 'Ticket', 
          populate: {
            path: 'lineCode',
            model: 'Line', 
          },
        })
        .populate({
          path: 'buyer',
          model: 'User', 
        })
        .sort({ createdAt: -1 })

        // const bookingsForLine = await Booking.aggregate([
        //   {
        //     $lookup: {
        //       from: 'tickets',
        //       localField: 'ticket',
        //       foreignField: '_id',
        //       as: 'ticket',
        //     },
        //   },
        //   {
        //     $unwind: '$ticket',
        //   },
        //   {
        //     $lookup: {
        //       from: 'lines',
        //       localField: 'ticket.lineCode',
        //       foreignField: '_id',
        //       as: 'ticket.lineCode',
        //     },
        //   },
        //   {
        //     $unwind: '$ticket.lineCode',
        //   },
        //   {
        //     $lookup: {
        //       from: 'users',
        //       localField: 'buyer',
        //       foreignField: '_id',
        //       as: 'buyer',
        //     },
        //   },
        //   {
        //     $unwind: '$buyer',
        //   },
        //   {
        //     $sort: { createdAt: -1 },
        //   },
        // ]).exec();
    
        const todaysDate = moment(new Date()).format('DD-MM-YYYY');
        const lineBookings = lines.map((line) => {
          const bookings = bookingsForLine.filter((booking) => line.code === booking.ticket.lineCode.code);
          const todaysBookings = bookings.filter((b) => b?.ticket?.date === todaysDate || b?.ticket?.returnDate === todaysDate);
    
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

    },

      getSingleLineBookings: async (req,res) =>{
        try {
          const all = await Booking.find({}).populate('buyer seller ticket');
          console.log(all.filter((b) => b.ticket.lineCode == req.params.id))
          const filtered = all.filter((b) => b.ticket.lineCode == req.params.id && (b.ticket.date == req.params.from || b.ticket.returnDate == req.params.from));

          // const bookingsForLine = await Booking.aggregate([
          //   {
          //     $lookup: {
          //       from: 'tickets',
          //       localField: 'ticket',
          //       foreignField: '_id',
          //       as: 'ticket',
          //     },
          //   },
          //   {
          //     $unwind: '$ticket',
          //   },
          //   {
          //     $lookup: {
          //       from: 'lines',
          //       localField: 'ticket.lineCode',
          //       foreignField: '_id',
          //       as: 'ticket.lineCode',
          //     },
          //   },
          //   {
          //     $unwind: '$ticket.lineCode',
          //   },
          //   {
          //     $lookup: {
          //       from: 'users',
          //       localField: 'buyer',
          //       foreignField: '_id',
          //       as: 'buyer',
          //     },
          //   },
          //   {
          //     $unwind: '$buyer',
          //   },
          //   {
          //     $sort: { createdAt: -1 },
          //   },
          //   {
          //     $match: {
          //       'ticket.lineCode._id': new mongoose.Types.ObjectId(req.params.id),
          //       $or: [
          //         { 'ticket.date': req.params.from },
          //         { 'ticket.returnDate': req.params.from },
          //       ],
          //     },
          //   },
          //   {
          //     $project: {
          //       'buyer.password': 0,
          //     },
          //   },
          // ]).exec();
      
          res.status(200).json(filtered);
        } catch (error) {
          console.log(error)
          res.status(500).json(error);
        }
      },

      // getSingleLineBookings: async (req,res) =>{
      //   try {
      //     const bookingsForLine = await Booking.find({}).populate({
      //       path: 'ticket',
      //       populate: { path: 'lineCode' }
      //     }).populate({
      //       path: 'buyer',
      //       select: '-password'
      //     }).sort({createdAt: 'desc'})
          
      //     var bookings = [];
      
      //     for (const booking of bookingsForLine) {
      //       if (booking.ticket.lineCode._id == req.params.id && (booking.ticket.date == req.params.from || booking.ticket.returnDate == req.params.from)) {
      //         bookings.push(booking);
      //         console.log(booking)
      //       }
      //     }

      //     console.log(bookings)
      //     res.status(200).json(bookings);
      //   } catch (error) {
      //     res.status(500).json(error);
      //   }
      // },

      deleteLine: async (req,res) => {
        try {
            const deletedLine = await Line.findByIdAndRemove(req.params.id);
            res.status(200).json(deletedLine);
        } catch (error) {
            res.status(500).json(error);
        }
      },


}