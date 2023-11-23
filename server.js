const cluster = require("cluster");
const Ticket = require("./models/Ticket");
const { default: fetch } = require("node-fetch");
const numCPUs = require("os").cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); 
  });
  
} else {
  const express = require("express");
  const app = express();
  const mongoose = require("mongoose");
  const cors = require("cors");
  const bodyParser = require("body-parser");
  const session = require('express-session');
  const MongoStore = require('connect-mongo');
  require("dotenv").config();

  const userRoutes = require("./routes/user");
  const agencyRoutes = require("./routes/agency");
  const ticketRoutes = require("./routes/ticket");
  const bookingRoutes = require("./routes/booking");
  const lineRoutes = require("./routes/line");
  const driverRoutes = require("./routes/driver");
  const ceoRoutes = require("./routes/ceo");
  const notificationRoutes = require("./routes/notification");
  const axios = require("axios");
  var cookieParser = require('cookie-parser');

  app.use(express.json());
  app.use(bodyParser.json());
  app.use(cors());
  app.use(cookieParser(process.env.OUR_SECRET));
  
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

   
 
  
  // app.use(cors({
  //   origin: ['http://localhost:4462', 'https://admin-hakbus.vercel.app']
  // }))

  app.use(session({
    secret: process.env.OUR_SECRET,
    resave: false,
    saveUninitialized: false
  }));

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

  //   setInterval(async () => {
  //     try {
  //       const today = new Date();
  //       const lastWeek = new Date();
  //       lastWeek.setDate(lastWeek.getDate() - 7);
    
  //       console.log('today, lw:', today.toISOString(), lastWeek.toISOString());
    
  //       const tickets = await Ticket.find({ date: { $lt: today.toISOString(), $gte: lastWeek.toISOString() } });
  //       console.log(tickets);
  //     } catch (error) {
  //       console.error('Error querying tickets:', error);
  //     }
  //   }, 10000);
    

  app.use('/user', userRoutes);
  app.use('/ticket', ticketRoutes);
  app.use('/agency', agencyRoutes);
  app.use('/booking', bookingRoutes);
  app.use('/ceo', ceoRoutes);
  app.use('/driver', driverRoutes);
  app.use('/line', lineRoutes);
  app.use('/notification', notificationRoutes);

  app.get('/', (req,res) => {
      res.json({message: "HakBus API"})
  })
  
    app.post("/create-paypal-order/:price", async (req, res) => {
      console.log(parseFloat(req.params.price))
      const order = await createOrder();
      res.json(order);
    });
    
    app.post("/capture-paypal-order/:user_id/:ticket_id", async (req, res) => {
      const { orderID } = req.body;
      console.log(req.params.user_id, req.params.ticket_id)
      const captureData = await capturePayment(orderID);
      res.json(captureData);
    });
    
    async function createOrder() {
      const baseURL = "https://api-m.sandbox.paypal.com";
      const accessToken = await generateAccessToken();
      const url = `${baseURL}/v2/checkout/orders`;
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
                currency_code: "EUR",
                value: "199.00",
              },
            },
          ],
        }),
      });
      const data = await response.json();
      return data;
    }
    
    async function capturePayment(orderId) {
      const baseURL = "https://api-m.sandbox.paypal.com";
      const accessToken = await generateAccessToken();
      const url = `${baseURL}/v2/checkout/orders/${orderId}/capture`;
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
    
    async function generateAccessToken() {
      const baseURL = "https://api-m.sandbox.paypal.com";
      const auth = Buffer.from(process.env.pci + ":" + process.env.pcs).toString("base64")
      const response = await fetch(`${baseURL}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
      const data = await response.json();
      return data.access_token;
    }

  const PORT = process.env.PORT || 4462;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on http://localhost:${PORT}`);
  });
}
