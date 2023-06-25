const e = require("cors");
const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const moment = require("moment");

module.exports = {

    placeBooking : async (req,res) => {
        try {
            const ticket = await Ticket.findById(req.params.ticketID);

            const newBooking = new Booking({
                buyer: req.params.buyerID,
                seller: req.params.sellerID,
                ticket: req.params.ticketID,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                phone: req.body.phone,
                age: req.body.age,
                price: req.body.age < 12 ? childrenPrice : price,
            })

            
            await newBooking.save().then( async () =>{
                await Ticket.findByIdAndUpdate(req.params.ticketID, { $inc : {numberOfTickets: -1} });
                await Agency.findByIdAndUpdate(
                    req.params.sellerID,
                    { $inc: { totalSales: 1, profit: req.body.price } }
                  );
             });
             
            res.status(200).json(newBooking);

        } catch (error) {
            res.status(500).json({ message: `Server error -> ${error}` });
        }
    },

    getSingleBooking: async(req,res) => {
        try {
            const booking = await Booking.findById(req.params.id);
            if(!booking) {
                return res.status(404).json("Booking not found");
            }
            res.status(200).json(booking);
            
        } catch (error) {
            res.status(500).json({ message: `Server error -> ${error}` })
        }
    },

    getMonthlyBookings : async (req,res) => {
        try {
            const allBookings = await Booking.find({}).lean();
            const monthlyStats = {};

            allBookings.forEach((booking) => {
                const bookingDate = moment(booking.createdAt);
                const monthYear = bookingDate.format("MMMM YYYY");
                console.log(monthYear)

                if(!monthlyStats[monthYear]) {
                    monthlyStats[monthYear] = []
                }
                
                monthlyStats[monthYear].push(booking);
            })

            res.status(200).json(monthlyStats);

        } catch (error) {
            res.status(500).json({ message: `Server error -> ${error}` })
            
        }
    },

}