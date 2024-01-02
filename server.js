const cluster = require("cluster");
const Ticket = require("./models/Ticket");
const { default: fetch } = require("node-fetch");
const Booking = require("./models/Booking");
const { sendBookingCancellationNotification } = require("./helpers/mail");
const { log } = require("console");
const { query } = require("express");
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
  require("dotenv").config();
  const helmet = require("helmet");
  const express = require("express");
  const app = express();
  const mongoose = require("mongoose");
  const cors = require("cors");
  const moment = require("moment")
  const bodyParser = require("body-parser");
  const session = require('express-session');
  const MongoStore = require('connect-mongo');
  const apicache = require("apicache");

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
  app.use(helmet());
  
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

  app.use('/user', userRoutes);
  app.use('/ticket', ticketRoutes);
  app.use('/agency', agencyRoutes);
  app.use('/booking', bookingRoutes);
  app.use('/ceo', ceoRoutes);
  app.use('/driver', driverRoutes);
  app.use('/line', lineRoutes);
  app.use('/notification', notificationRoutes);

  
  const crypto = require('crypto');
  function generateSignature(httpMethod, requestBody, contentType, dateHeader, requestUri, secret) {
    const formattedRequestUri = requestUri.replace(/\t/g, ''); 
    console.log({formattedRequestUri})
    const message = `${httpMethod}\n${crypto.createHash('sha512').update(requestBody).digest('hex')}\n${contentType}\n${dateHeader}\n${formattedRequestUri}`;
    console.log({ message });
  
    const hmac = crypto.createHmac('sha512', secret);
    hmac.update(message, 'utf-8');
  
    return hmac.digest('base64');
  }
  
  

  function generateBasicAuthHeader(username, password) {
    const authString = `${username}:${password}`;
    const base64Encoded = Buffer.from(authString, 'utf-8').toString('base64');
    return `Basic ${base64Encoded}`;
  }

  app.post('/proccess_payment',async (req,res) => {
    console.log({tokeniii: req.body.transaction_token})
    const apiKey = '	863001IC086301-SIM';
    const sharedSecret = 'BEqa9mX1JEkrmtdGCvVZg767e3XkJD';
    const apiUrl = `https://gateway.bankart.si/api/v3/transaction/${apiKey}/debit`;
    const apiUsername = 'API00863001HAKKOMERC'; 
    const apiPassword = '?exoSkk4"L5v@$$dShP0AND7PV@gI'; 
    
    const basicAuth = generateBasicAuthHeader(apiUsername, apiPassword)
    console.log({basicAuth})
    const transactionData = {
      "merchantTransactionId": "2024-01-01-0001",
      "amount": req.body.Amount,
      "currency": "EUR",
      "successUrl": "https://www.hakbus.org?success=true",
      "cancelUrl": "https://www.hakbus.org?success=false",
      "errorUrl": "https://www.hakbus.org?error=true",
      "callbackUrl": "https://www.hakbus.org?callback=true",
      "transactionToken": req.body.transaction_token,
      "description": "HakBus Booking",
      "customer": {
        "firstName": req.body.first_name,
        "lastName": req.body.last_name,
        "email": req.body.email,
      },
      "language": req.body.Language
    }
    

  const dateHeader = new Date().toUTCString();
  const headers = { 
    'Content-Type' : 'application/json; charset=utf-8',
    'Date': dateHeader
  };

  const requestUri = `/api/v3/transaction/${apiKey}/debit`;
  console.log({requestUri})
  const signature = generateSignature('POST', JSON.stringify(transactionData), headers['Content-Type'], dateHeader, requestUri, sharedSecret);
  
  headers['X-Signature'] = signature;
  // headers['Authorization'] = basicAuth;

  const requestOptions = {
    headers,
  };

  console.log({headers})
  try {
    const response = await axios.post(apiUrl, transactionData, requestOptions);
    console.log('Transaction successful:', response.data);
    res.json("payment success");
  } catch (error) {
    console.error('Transaction failed:', error.response.data);
    res.status(500).json("payment failed");
  }
    // console.log(response.data)  
    // res.send(response.data)
  })
  
  const checkAndCancelBookings = async () => {
    try {
      const today = moment(new Date()).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
      const bookings = await Booking.find({ });
  
      for (const booking of bookings) {
        console.log({ today: new Date(today), bdate: new Date(booking.date) });
  
        if (!booking.isPaid) {
          console.log({ paid: booking.isPaid });
  
          for (const passenger of booking.passengers) {
            await sendBookingCancellationNotification(passenger, booking);
          }
  
          await Booking.findByIdAndRemove(booking._id);
        }
      }
    } catch (error) {
      console.error('Error in booking cancellation process:', error);
    }
  };
  
  // setInterval(checkAndCancelBookings, 1000 * 10);

  const PORT = process.env.PORT || 4462;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on http://localhost:${PORT}`);
  });
}