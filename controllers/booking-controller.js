require("dotenv").config();
const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const moment = require("moment");
const Agency = require("../models/Agency");
const Ceo = require("../models/Ceo");
const { sendOrderToUsersEmail, sendAttachmentToAllPassengers, generateQRCode, cancelNotPaidBookingImmediately } = require("../helpers/mail");
const User = require("../models/User");
const mongoose = require('mongoose');
var admin = require("firebase-admin");
var serviceAccount = require("../helpers/firebase/firebase-config.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

  function calculateAge(birthDate) {
    const today = new Date();
    const birthDateArray = birthDate.split("-"); 
    const birthDateObj = new Date(
      birthDateArray[2],
      birthDateArray[1] - 1,
      birthDateArray[0]
    );
   
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age -= 1;
    } 
  
    return age;
  }
  

  const findPrice = (ticket, from, to) => {
    const stop = ticket?.stops?.find(s => s.from.some(cityInfo => cityInfo.code === from) && s.to.some(t => t.code === to));
    if (stop) {
      return stop.price;
    } else {
      return "Price not found";
    }
  };
  
  const findChildrenPrice = (ticket, from, to) => {
    console.log({from, to});
    const stop = ticket.stops.find(s => s.from.some(cityInfo => cityInfo.code === from) && s.to.some(t => t.code === to));
    if (stop) {
      return stop.childrenPrice;
    } else {
      return "Children Price not found";
    }
  };
  
  
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

  placeBooking : async (req, res) => {
    try {
      const ceo = await Ceo.aggregate([{$match: {}}]);
      const type = req.body.type;
      const onlyReturn = req.body.onlyReturn;
      const numberOfPsg = req.body.passengers.length || 1;
      const ticket = await Ticket.findById(req.params.ticketID).populate("lineCode");

      if(onlyReturn) {
        if(ticket.numberOfReturnTickets < numberOfPsg) {
          res.status(400).json('Number of tickets requested is more than available for this return trip');     
        }
      }

      if(numberOfPsg > ticket.numberOfTickets) {
        res.status(400).json('Number of tickets requested is more than available');
      }
      
      if(type){
        if(numberOfPsg > ticket.numberOfReturnTickets) {
          res.status(400).json('Number of tickets requested is more than available for both ways');
        }
      }

      if(!type) {
        if(ticket.numberOfTickets < 1){
          return res.status(400).json("Not seats left");
        } 
      }

      if(type) {
        if(ticket.numberOfTickets < 1 || ticket.numberOfReturnTickets < 1 || (ticket.numberOfTickets < 1 && ticket.numberOfReturnTickets < 1)){
          return res.status(400).json("Not seats left for both ways");
        }
      }

      
      let totalPrice = 0;
      const passengers = req.body.passengers.map((passenger) => {
        const age = calculateAge(passenger.birthDate);
        const passengerPrice = age <= 10 ? findChildrenPrice(ticket, req.body.from.code, req.body.to.code) : findPrice(ticket, req.body.from.code, req.body.to.code);
        totalPrice += passengerPrice + (ticket?.lineCode?.luggagePrice * passenger.numberOfLuggages);
        return {
          email: passenger.email,
          phone: passenger.phone,
          fullName: passenger.fullName,
          birthDate: passenger.birthDate,
          age: parseInt(age),
          price: passengerPrice,
          numberOfLuggages: passenger.numberOfLuggages,
          luggagePrice: ticket?.lineCode?.luggagePrice * passenger.numberOfLuggages,
          // luggagePrice: findPassengersLuggagePrice(ticket, passenger),
        };
      });

      let bookingType;

      if(type) {
        bookingType = 'both'
      } else if(onlyReturn) {
        bookingType = 'return'
      } else {
        bookingType = 'oneway'
      }

      const buyerID = req.params.buyerID;
      let buyerObjectId;

      if (buyerID) {
        try {
          buyerObjectId = new mongoose.Types.ObjectId(buyerID);
        } catch (error) {
        }
      } else {
        buyerObjectId = undefined;
      }

      const newBooking = new Booking({
        buyer: buyerObjectId,
        ticket: req.params.ticketID,
        firstname: req.body.firstname,
        date: findDate(ticket, req.body.from.code, req.body.to.code),
        from: req.body.from.value,
        to: req.body.to.value,
        fromCode: req.body.from.code,
        toCode: req.body.to.code,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone,
        age: req.body.age,
        price: totalPrice,
        passengers: passengers,
        platform: req.body.platform,
      });
  
      await newBooking.save().then(async () => {
          await Ticket.findByIdAndUpdate(req.params.ticketID, {
            $inc: { numberOfTickets: -numberOfPsg },
          });
      });
      
      const destination = { from: req.body.from.value, to: req.body.to.value };
      const dateTime = { date: ticket.date, time: findTime(ticket, req.body.from.code, req.body.to.code) };
      const dateString = findDate(ticket, req.body.from.code, req.body.to.code)

      setTimeout(async() => {
        const b = await Booking.findById(newBooking._id);
        if(!b.isPaid) {
          return await Booking.findByIdAndRemove(b._id);
        }
        
          await generateQRCode(newBooking._id.toString(), newBooking.passengers, destination, dateTime,new Date(dateString).toDateString(), ticket?.lineCode?.freeLuggages);
       }, 1000 * 60 * 5);
        
      var seatNotification = {};
      if (ticket.numberOfTickets <= ceo[0].nrOfSeatsNotification + 1) {
        seatNotification = {
          message: `Kanë mbetur vetëm ${ceo[0].nrOfSeatsNotification} vende të lira për linjën (${ticket.from} / ${ticket.to}) me datë ${moment(ticket.date).format('DD-MM-YYYY')}`,
          title: `${ceo[0].nrOfSeatsNotification} ulëse të mbetura`,
          ticket_id: ticket._id,
          link: `${process.env.FRONTEND_URL}/ticket/edit/${ticket._id}`,
          confirmed: false,
        };
        await Ceo.findByIdAndUpdate(ceo[0]._id, { $push: { notifications: seatNotification } });
      }
       
      const createdBooking = await Booking.findById(newBooking._id).populate('ticket seller')
      res.status(200).json(createdBooking);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: `Server error -> ${error}` });
    }
  },

      cancelNotPaidImmediatelyBooking: async (req,res) => {
        try {
          const deltedBooking = await Booking.findByIdAndRemove(req.params.id);
          console.log(deltedBooking)
          if(!deltedBooking) {
            return res.status(404).json("booking not found");
          }
          await Ticket.findByIdAndUpdate(deltedBooking?.ticket, {
            $inc: { numberOfTickets: deltedBooking?.passengers?.length },
          });

          if(deltedBooking?.isPaid) {
            await cancelNotPaidBookingImmediately(deltedBooking);
          }
          return res.status(200).json("Booking cancelled immediately");
        } catch (error) {
          console.log(error);
          res.status(500).json({ message: `Server error -> ${error}` });
        }
      },
      
      payBooking: async (req,res) => {
        try {
          console.log({tid: req.params.tid})
          await Booking.findByIdAndUpdate(req.params.id, { $set: { isPaid: true, transaction_id: req.params.tid } })
          return res.status(200).json("Paid");
        } catch (error) {
          console.log(error);
          res.status(500).json({ message: `Server error -> ${error}` });
        }
      },
      
      getAllBookings: async (req,res)=>{
        try {
          const allBookings = await Booking.find({}).populate({
            path: 'seller buyer ticket',
            select: '-password' 
          });
          res.status(200).json(allBookings)
        } catch (error) {
          res.status(500).json({ message: `Server error -> ${error}` });
          
        }

      },

       getFilteredBookings : async (req, res) => {
        try {
          if (!req.query.from || !req.query.to) {
            return res.status(400).json('Please provide both "from" and "to" dates.');
          }
      
          const fromDate = moment(req.query.from, 'DD-MM-YYYY').toISOString();
          const toDate = moment(req.query.to, 'DD-MM-YYYY').toISOString();
          
          let query = {
            createdAt: { $gte: fromDate, $lte: toDate },
          };
          
          if (req.query.agency) {
            query['seller'] = req.query.agency;
          }
          
          if (req.query.city) {
            query['seller.city'] = req.query.city;
          }
          
          console.log({req: req.query})
          console.log({query})
      
          const filteredBookings = await Booking.find(query)
          .populate({
            path: 'seller',
            select: '-password',
          })
          .populate({
            path: 'buyer',
            select: '-password',
          })
          .populate({
            path: 'ticket',
            populate: { path: 'lineCode' },
          });
      
          res.status(200).json(filteredBookings);
        } catch (error) {
          res.status(500).json({ message: `Server error -> ${error.message}` });
        }
      },
      
      
      getBookingsFromDateRange: async (req, res) => {
        try {
          if (req.query.from === "" && req.query.to === "") {
            const filteredBookings = await Booking.find()
              .populate({
                path: 'buyer',
                select: '-password' 
              }).populate({
                path: 'ticket',
                populate: { path: 'lineCode' } 
              }).populate({
                path: 'seller',
                select: '-password'
              })
              .sort({ createdAt: 'desc' });
            res.status(200).json(filteredBookings);
          } else {
            const fromDate = moment(req.query.from, 'DD-MM-YYYY').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            const toDate = moment(req.query.to, 'DD-MM-YYYY').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
      
            const filteredBookings = await Booking.find({
              createdAt: { $gte: fromDate, $lte: toDate }
            })
              .populate({
                path: 'buyer',
                select: '-password' 
              })
              .populate({
                path: 'ticket',
                populate: { path: 'lineCode' } 
              }).populate({
                path: 'seller',
                select: '-password'
              })
              .sort({ createdAt: 'desc' });
      
            res.status(200).json(filteredBookings);
          }
        } catch (error) {
          console.log(error);
          res.status(500).json({ message: `Server error -> ${error}` });
        }
      },
      
      

    getSingleBooking: async(req,res) => {
        try {
            const booking = await Booking.findById(req.params.id).populate({
              path: 'seller buyer',
              select: '-password' 
            }).populate({
              path: 'ticket',
              populate: { path: 'lineCode' }
            });
            if(!booking) {
                return res.status(404).json("Booking not found");
            }
            res.status(200).json(booking);
            
        } catch (error) {
            res.status(500).json({ message: `Server error -> ${error}` })
        }
    },

    getMonthlyBookings: async (req, res) => {
        try {
          const now = new Date();
          const currentYear = now.getFullYear();
          const monthlyBookings = [];
      
          for (let month = 0; month < 12; month++) {
            const startDate = new Date(currentYear, month, 1);
            const endDate = new Date(currentYear, month + 1, 0, 23, 59, 59);
      
            const bookings = await Booking.find({
              createdAt: { $gte: startDate, $lte: endDate },
            });
      
            monthlyBookings.push({ month: month + 1, bookings, length: bookings.length });
          }
      
          res.status(200).json(monthlyBookings);
        } catch (error) {
          res.status(500).json({ message: `Server error -> ${error}` });
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
