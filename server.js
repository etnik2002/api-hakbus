const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const PORT = process.env.PORT | 4462;
const bodyParser = require("body-parser");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const paypal = require('./controllers/paypal-controller')
require("dotenv").config();

const userRoutes = require("./routes/user")
const agencyRoutes = require("./routes/agency")
const ticketRoutes = require("./routes/ticket")
const bookingRoutes = require("./routes/booking")
const lineRoutes = require("./routes/line")
const driverRoutes = require("./routes/driver")
const ceoRoutes = require("./routes/ceo");
const notificationRoutes = require("./routes/notification");
const axios = require("axios");
const Agency = require("./models/Agency");

const apiurl = process.env.API_URL;

var admin = require("firebase-admin");

const User = require("./models/User");
const Ticket = require("./models/Ticket");



// var whitelist = ['http://localhost:8100','http://localhost:8101', 'https://admin-hakbus-6ktvemx13-etnik2002.vercel.app/']
// var corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//  }
// }

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });
  
  app.get('/', (req, res) => {
    try {
      res.status(200).json({message: "HakBus API"})
    } catch (error) {
      res.status(500).json({message: "Error"})
    }
  })


  // app.use(function (req, res, next) {
  //   const allowedOrigins = ['http://localhost:8100','http://localhost:8101', 'https://admin-hakbus-6ktvemx13-etnik2002.vercel.app/'];
  
  //   const origin = req.headers.origin;
  //   if (allowedOrigins.includes(origin)) {
  //     res.setHeader('Access-Control-Allow-Origin', origin);
  //   } else {
  //     return res.status(403).json({ error: 'Unauthorized origin' });
  //   }
  
  //   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  //   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  //   res.setHeader('Access-Control-Allow-Credentials', true);
  //   next();
  // });
  

  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  
  app.use(express.json());
  app.use(bodyParser.json());
  app.use(cors());
  
  app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
  }));

  app.use('/user', userRoutes);
  app.use('/ticket', ticketRoutes);
  app.use('/agency', agencyRoutes);
  app.use('/booking', bookingRoutes);
  app.use('/ceo', ceoRoutes);
  app.use('/driver', driverRoutes);
  app.use('/line', lineRoutes);
  app.use('/notification', notificationRoutes);
  
  app.use(
    session({
      secret: process.env.OUR_SECRET,
      resave: false,
      saveUninitialized: true,
      store: MongoStore.create({
        mongoUrl: process.env.DATABASE_URL,
      }),
    })
  );
  
  mongoose.connect(process.env.DATABASE_URL)
    .then(() => { console.log("Connected to database!") })
    .catch((err) => { console.log("Connection failed!", err) });



    app.post("/my-server/create-paypal-order/:agencyID", async (req, res) => {
      try {
        const order = await paypal.createOrder(req.body, req.params.agencyID);
        res.json(order);
      } catch (err) {
        res.status(500).json(err);
      }
    });
    
    app.post("/my-server/capture-paypal-order/:buyerID/:sellerID/:ticketID", async (req, res) => {
      const { orderID } = req.body;
      const { firstname, lastname, email, phone, age, sendEmailNotification, sendSmsNotification } = req.body;
      const agency = await Agency.findById(req.params.sellerID);
      const user = await User.findById(req.params.buyerID);
      const ticket = await Ticket.findById(req.params.ticketID);
      const fcmToken = user.fcmToken;
      
      const notificationPayload = {
        notification: {
          title: 'Hak Bus',
          body: `Hey ${user.name}. Your booking is ${ticket.from} -> ${ticket.to}`
        },
         
      };
      
      try {
        const captureData = await paypal.capturePayment(orderID, agency._id).then(async () => {
          const booking = await axios.post(`${apiurl}/booking/create/${req.params.buyerID}/${req.params.sellerID}/${req.params.ticketID}`, {
            firstname: req.body.firstname, lastname: req.body.lastname, email: req.body.email, phone: req.body.phone, age: req.body.age, sendEmailNotification: req.body.sendEmailNotification, sendSmsNotification: req.body.sendSmsNotification
          }).then(async (res) => {
            // await admin.messaging().sendToDevice(fcmToken, notificationPayload)
            //   .then((response) => {
            //     console.log('Successfully sent message:', response.results[0].error, payload);
            //   })
            //   .catch((error) => {
            //     console.log('Error sending message:', error);
            //   });
            console.log(res)
          });
        });
      
        res.status(200).json(captureData);
      } catch (err) {
        console.log(err);
        res.status(500).json(err);
      }
      
    });

    const TicketService = require("./services/ticketService");
    app.get('/alltickets', (req,res) => {
      const ticketService = new TicketService();
      ticketService.getAllTickets().then((data) => {
        console.log(data)
        res.status(200).json(data)
      } )
    })

app.listen(PORT, ()=> {console.log(`server listeting on http://localhost:${PORT}`)})