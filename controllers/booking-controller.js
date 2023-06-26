const e = require("cors");
const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const moment = require("moment");
const Agency = require("../models/Agency");
const Ceo = require("../models/Ceo");

module.exports = {

    placeBooking: async (req, res) => {
        try {
            const ticket = await Ticket.findById(req.params.ticketID);
            const price = req.body.age <= 12 ? ticket.childrenPrice : ticket.price;
            const agency = await Agency.findById(req.params.sellerID);

            const agencyPercentage = agency.percentage / 100;
            const agencyEarnings = price - price * agencyPercentage;
            const ourEarnings = price - agencyEarnings;

            const newBooking = new Booking({
                buyer: req.params.buyerID,
                seller: req.params.sellerID,
                ticket: req.params.ticketID,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                phone: req.body.phone,
                age: req.body.age,
                price: price,
            });
        
            await newBooking.save().then(async () => {
                await Ticket.findByIdAndUpdate(req.params.ticketID, {
                    $inc: { numberOfTickets: -1 },
                });
                await Agency.findByIdAndUpdate(req.params.sellerID, {
                    $inc: { totalSales: 1, profit: agencyEarnings },
                });
                
                await Ceo.findByIdAndUpdate('6498755c438b9ec3237688ca', { $inc: { totalProfit: ourEarnings }});
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
    getWeeklyBookings: async (req, res) => {
        try {
          console.log("start")
          const allBookings = await Booking.find({}).lean();
          const weeklyStats = {};
      
          allBookings.forEach((booking) => {
            const bookingDate = moment(booking.createdAt);
            const weekStartDate = moment().subtract(1, 'week').startOf('week');
            const weekEndDate = moment().subtract(1, 'week').endOf('week');
            
            if (bookingDate.isBetween(weekStartDate, weekEndDate, undefined, '[]')) {
              const bookingDay = bookingDate.format("dddd");
              
              if (!weeklyStats[bookingDay]) {
                weeklyStats[bookingDay] = [];
              }
              
              weeklyStats[bookingDay].push(booking);
            }
          });
      
          res.status(200).json(weeklyStats);
        } catch (error) {
          res.status(500).json({ message: `Server error -> ${error}` });
        }
      },
      

}