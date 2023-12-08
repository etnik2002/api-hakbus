const cluster = require("cluster");
const Ticket = require("./models/Ticket");
const fetch = require("node-fetch");
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
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  const csrf = require('csurf');
  require("dotenv").config();

  const userRoutes = require("./routes/user");
  const agencyRoutes = require("./routes/agency");
  const ticketRoutes = require("./routes/ticket");
  const bookingRoutes = require("./routes/booking");
  const lineRoutes = require("./routes/line");
  const driverRoutes = require("./routes/driver");
  const ceoRoutes = require("./routes/ceo");
  const notificationRoutes = require("./routes/notification");
  var cookieParser = require('cookie-parser');

  app.use(helmet());
  app.use(cors());
  app.use(cookieParser(process.env.OUR_SECRET));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
  });
  app.use(limiter);

  app.use(
    express.urlencoded({
      extended: true,
    })
  );

  app.use(
    session({
      resave: false,
      saveUninitialized: true,
      store: MongoStore.create({
        mongoUrl: process.env.DATABASE_URL,
      }),
      cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
      },
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

  app.get('/', (req, res) => {
    res.json({ message: "HakBus API" });
  });

  const PORT = process.env.PORT || 4462;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on http://localhost:${PORT}`);
  });
}
