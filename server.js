const cluster = require("cluster");
const Ticket = require("./models/Ticket");
const { default: fetch } = require("node-fetch");
const Booking = require("./models/Booking");
const { sendBookingCancellationNotification } = require("./helpers/mail");
const { log } = require("console");
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
    const message = `${httpMethod}\n${crypto.createHash('sha512').update(requestBody).digest('hex')}\n${contentType}\n${dateHeader}\n${requestUri}`;
  
    const hmac = crypto.createHmac('sha512', secret);
    hmac.update(message, 'utf-8');
  
    return hmac.digest('base64');
  }

  app.post('/',async (req,res) => {
    console.log({req})
    
    const apiKey = '863001IC086301-Sim';
    const sharedSecret = 'BEqa9mX1JEkrmtdGCvVZg767e3XkJD';
    const apiUrl = `https://your-api-url.com/api/v3/transaction/${apiKey}/debit`;
    
    const transactionData = {
      "merchantTransactionId": "2019-09-02-0001",
      "additionalId1": "x0001",
      "additionalId2": "y0001",
      "extraData": {
        "someKey": "someValue",
        "otherKey": "otherValue"
      },
      "merchantMetaData": "merchantRelevantData",
      "amount": "9.99",
      "surchargeAmount": "0.9",
      "currency": "EUR",
      "successUrl": "https://example.com/success",
      "cancelUrl": "https://example.com/cancel",
      "errorUrl": "https://example.com/error",
      "callbackUrl": "https://example.com/callback",
      "transactionToken": "ix::tRaNsAcT1OnToK3N",
      "description": "Example Product",
      "customer": {
        "identification": "c0001",
        "firstName": "John",
        "lastName": "Doe",
        "birthDate": "1990-10-10",
        "gender": "M",
        "billingAddress1": "Maple Street 1",
        "billingAddress2": "Syrup Street 2",
        "billingCity": "Victoria",
        "billingPostcode": "V8W",
        "billingState": "British Columbia",
        "billingCountry": "CA",
        "billingPhone": "1234567890",
        "shippingFirstName": "John",
        "shippingLastName": "Doe",
        "shippingCompany": "Big Company Inc.",
        "shippingAddress1": "Yellow alley 3",
        "shippingAddress2": "Yellow alley 4",
        "shippingCity": "Victoria",
        "shippingPostcode": "V8W",
        "shippingState": "British Columbia",
        "shippingCountry": "CA",
        "shippingPhone": "1234567890",
        "company": "John's Maple Syrup",
        "email": "john@example.com",
        "emailVerified": false,
        "ipAddress": "127.0.0.1",
        "nationalId": "123123",
        "extraData": {
          "someCustomerDataKey": "value",
          "anotherKey": "anotherValue"
        },
        "paymentData": {
          "ibanData": {
            "iban": "AT123456789012345678",
            "bic": "ABC",
            "mandateId": "1234",
            "mandateDate": "2019-09-29"
          }
        }
      },
      "threeDSecureData": {
        "3dsecure": "MANDATORY"
      },
      "language": "en"
    }
    
    const dateHeader = 'Tue, 21 Jul 2020 13:15:03 UTC';
    
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Date': dateHeader,
    };
    
    const signature = generateSignature('POST', JSON.stringify(transactionData), headers['Content-Type'], dateHeader, apiUrl, sharedSecret);
    headers['X-Signature'] = signature;
    console.log({transactionData: transactionData.customer.paymentData})
    const requestOptions = {
      headers,
    };
    
    const response = await axios.post(apiUrl, transactionData, requestOptions)
      res.send(response.data)
      
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