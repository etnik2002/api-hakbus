const e = require("cors");
const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");
const moment = require("moment");
const Agency = require("../models/Agency");
const Ceo = require("../models/Ceo");
const { sendOrderToUsersEmail } = require("../helpers/mail");
const User = require("../models/User");
const mongoose = require('mongoose');
const stripe = require('stripe');
require("dotenv").config();

module.exports = {

    placeBooking: async (req, res) => {
        try {
            const user = await User.findById(req.query.buyerID);
            const ticket = await Ticket.findById(req.params.ticketID);
            const agency = await Agency.findById(req.params.sellerID);
            const price = req.body.age <= 10 ? ticket.childrenPrice : ticket.price;

            const agencyPercentage = agency.percentage / 100;
            const agencyEarnings = price - price * agencyPercentage;
            const ourEarnings = price - agencyEarnings;

            const sendEmailNotification = req.body.sendEmailNotification;
            const sendSmsNotification = req.body.sendSmsNotification;
 
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
                passengers: req.body.passengers,
                
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

            // const customersName = `${req.body.firstname || user.name} ${req.body.lastname  || user.name}`;
            // sendEmailNotification && await sendOrderToUsersEmail(req.body.email  || user.email, ticket, user._id, user.name, customersName);

            res.status(200).json(newBooking);
            } catch (error) {
              console.log(error)
              res.status(500).json({ message: `Server error -> ${error}` });
            }
      },

      

      payBooking: async (req, res) => {
        try {
          console.log("start");
          const DOMAIN = "http://localhost:4462";
          const user = await User.findById(req.params.buyerID);
          const ticket = await Ticket.findById(req.params.ticketID).populate('agency');
          const agency = await Agency.find({});
          const price = req.body.age <= 12 ? ticket.childrenPrice : ticket.price;
          const API_KEY = agency.pls;
          
          const agencyPercentage = agency.percentage / 100;
          const agencyEarnings = price - price * agencyPercentage;
          const ourEarnings = price - agencyEarnings;
      
          const sendEmailNotification = req.body.sendEmailNotification;
          const sendSmsNotification = req.body.sendSmsNotification;
          const stripeInstance = stripe(API_KEY);
          
          try {
            const { token } = req.body;
      
            const customer = await stripeInstance.customers.create({
              source: token.id,
              email: token.email,
            });
      
            const charge = await stripeInstance.charges.create({
              amount: price,
              currency: "eur",
              customer: customer.id,
              receipt_email: token.email,
              description: "Hak Bus Ticket"
            });
      
      
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create checkout session -> ' + error });
          }
      
          const newBooking = new Booking({
            buyer: req.params.buyerID,
            seller: req.params.sellerID,
            ticket: req.params.ticketID,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            phone: req.body.phone,
            age: req.body.age,
            bookingDate: moment().format("DD-M-YYYY"),
            price: price,
          });
      
          await newBooking.save().then(async () => {
            await Ticket.findByIdAndUpdate(req.params.ticketID, {
              $inc: { numberOfTickets: -1 },
            });
            await Agency.findByIdAndUpdate(req.params.sellerID, {
              $inc: { totalSales: 1, profit: agencyEarnings },
            });
      
            await Ceo.findByIdAndUpdate('6498755c438b9ec3237688ca', { $inc: { totalProfit: ourEarnings } });
          });
      
          const customersName = `${req.body.firstname} ${req.body.lastname}`;
          await sendOrderToUsersEmail(user.email, ticket, user._id, user.name, customersName);
      
          res.status(200).json(newBooking);
        } catch (error) {
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

      getFilteredBookings: async (req, res) => {
        try {
          if (req.query.agency === '' || req.query.from === '' || req.query.to === '') {
            return res.status(500).json('Please fill in all the fields');
          } else {
            const fromDate = moment(req.query.from, 'DD-MM-YYYY').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'); 
            const toDate = moment(req.query.to, 'DD-MM-YYYY').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'); 
            console.log(fromDate, toDate)

            const filteredBookings = await Booking.find({
              createdAt: { $gte: fromDate, $lte: toDate },
              seller: req.query.agency
            }).populate({
              path: 'seller buyer ticket',
              select: '-password' 
            });
      
            res.status(200).json(filteredBookings);
          }
        } catch (error) {
          res.status(500).json({ message: `Server error -> ${error}` });
        }
      },
      
      
      getBookingsFromDateRange: async (req, res) => {
        try {
          if (req.query.from === "" && req.query.to === "") {
            const filteredBookings = await Booking.find()
              .populate({
                path: 'seller buyer ticket',
                select: '-password' 
              });
            res.status(200).json(filteredBookings);
          } else {
            const fromDate = moment(req.query.from, 'DD-MM-YYYY').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            const toDate = moment(req.query.to, 'DD-MM-YYYY').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
      
            const filteredBookings = await Booking.find({
              createdAt: { $gte: fromDate, $lte: toDate }
            }).populate({
              path: 'seller buyer',
              select: '-password' 
            }).populate({
              path: 'ticket',
              populate: { path: 'lineCode' }
            });
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
      
      payPalOrder: async (req,res) => {
        app.post("/create-paypal-order", async (req, res) => {
          const order = await createOrder();
          res.json(order);
        });
        
        // capture payment & store order information or fullfill order
        app.post("/capture-paypal-order", async (req, res) => {
          const { orderID } = req.body;
          const captureData = await capturePayment(orderID);
          // TODO: store payment information such as the transaction ID
          res.json(captureData);
        });
        
        //////////////////////
        // PayPal API helpers
        //////////////////////
        
        // use the orders api to create an order
        async function createOrder() {
          const accessToken = await generateAccessToken();
          const url = `${baseURL.sandbox}/v2/checkout/orders`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    currency_code: "USD",
                    value: "100.00",
                  },
                },
              ],
            }),
          });
          const data = await response.json();
          return data;
        }
        
        // use the orders api to capture payment for an order
        async function capturePayment(orderId) {
          const accessToken = await generateAccessToken();
          const url = `${baseURL.sandbox}/v2/checkout/orders/${orderId}/capture`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const data = await response.json();
          return data;
        }
        
        // generate an access token using client id and app secret
        async function generateAccessToken() {
          const auth = Buffer.from(CLIENT_ID + ":" + APP_SECRET).toString("base64")
          const response = await fetch(`${baseURL.sandbox}/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
              Authorization: `Basic ${auth}`,
            },
          });
          const data = await response.json();
          return data.access_token;
        }
      },



}