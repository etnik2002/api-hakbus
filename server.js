const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const PORT = process.env.PORT | 4462;
const bodyParser = require("body-parser");
const session = require('express-session');
const MongoStore = require('connect-mongo');
require("dotenv").config();
const paypal = require('./controllers/paypal-controller')

const userRoutes = require("./routes/user")
const agencyRoutes = require("./routes/agency")
const ticketRoutes = require("./routes/ticket")
const bookingRoutes = require("./routes/booking")
const ceoRoutes = require("./routes/ceo");
const axios = require("axios");
const Agency = require("./models/Agency");

const apiurl = process.env.API_URL;

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });
  
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
      console.log({bodyFromFront: req.body})
      const { orderID } = req.body;
      const { firstname, lastname, email, phone, age, sendEmailNotification, sendSmsNotification } = req.body;
      const agency = await Agency.findById(req.params.sellerID)
      

      try {
        const captureData = await paypal.capturePayment(orderID, agency._id).then( async () => {
          const booking = await axios.post(`${apiurl}/booking/create/${req.params.buyerID}/${req.params.sellerID}/${req.params.ticketID}`,{
            firstname, lastname, email, phone, age, sendEmailNotification, sendSmsNotification
          }).then((res) => {
            console.log(res)
          })
        })
        console.log(captureData)
        res.status(200).json(captureData);
      } catch (err) {
        console.log(err)
        res.status(500).json(err);
      }
    });


app.listen(PORT, ()=> {console.log(`server listeting on http://localhost:${PORT}`)})