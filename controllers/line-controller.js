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

    getLineBookings: async (req, res) => {
        try {
          const lines = await Line.find({});
      
          const lineBookings = {};
      
          for (const line of lines) {
            const bookingsForLine = await Booking.find({ 'ticket.lineCode': line.code })
              .populate('ticket'); 
      
            lineBookings[line._id] = bookingsForLine;
          }
      
          res.status(200).json(lineBookings);
        } catch (error) {
          res.status(500).json(error);
        }
      },

      getSingleLineBookings: async (req,res) =>{
            try {
                const bookingsForLine = await Booking.find({ 'ticket.lineCode': req.params.lineID }).populate('ticket'); 
                res.status(200).json(bookingsForLine);
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