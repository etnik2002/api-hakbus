const Booking = require("../models/Booking");
const Line = require("../models/Line");

module.exports = {

    createLine: async (req,res) => {
        try {
            const newLine = new Line({
                code: req.body.code,
                from: req.body.from,
                to: req.body.to,

            })

            await newLine.save();
            res.status(200).json("New line created!");

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
        const bookingsForLine = await Booking.find({}).populate({
          path: 'ticket',
          populate: { path: 'lineCode' }
        }).populate('buyer');
    
        const lineBookings = lines.map(line => {
          const bookings = bookingsForLine.filter(booking => line.code === booking.ticket.lineCode.code);
          return { line: line.code, from: line.from,to: line.to, bookings: bookings };
        });
    
        res.status(200).json(lineBookings);
      } catch (error) {
        res.status(500).json(error);
      }
    },
    

      getSingleLineBookings: async (req,res) =>{
        try {
          const bookingsForLine = await Booking.find({}).populate({
            path: 'ticket',
            populate: { path: 'lineCode' }
          }).populate({
            path: 'buyer',
            select: '-password'
          });
          


          var bookings = [];
      
          for (const booking of bookingsForLine) {
            if (booking.ticket.lineCode._id == req.params.id && booking.ticket.date == req.params.from) {
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