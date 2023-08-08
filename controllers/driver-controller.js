const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const bcrypt = require('bcrypt')
const mongoose = require("mongoose")

module.exports = {


    createDriver: async (req,res ) => {
        try {

            const newDriver = new Driver({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                code: req.body.code,
                lines: req.body.lines
            })

            await newDriver.save();
            res.status(201).json("created driver")

        } catch (error) {
            res.status(500).json(error)
        }
    },

    getAllDrivers: async (req,res) => {
      try {
        const drivers = await Driver.aggregate([
          {
            $lookup: {
              from: 'bookings',
              localField: 'scannedBookings',
              foreignField: '_id',
              as: 'scannedBookings',
            },
          },
          {
            $lookup: {
              from: 'lines',
              localField: 'lines',
              foreignField: '_id',
              as: 'lines',
            },
          },
        ]).exec();

        res.status(200).json(drivers);
      } catch (error) {
        res.status(500).json(error);
      }
    },

    login: async (req, res) => {
      try {
  
        const driver = await Driver.findOne({ email: req.body.email });
        if (!driver) {
          return res.status(401).json({ message: "Invalid Email " });
        }
  
        const validPassword = req.body.password === driver.password;
  
        if (!validPassword) {
          return res.status(401).json({ data: null, message: "Invalid  Password" });
        }
  
        const token = driver.generateAuthToken(driver);
        await Driver.findByIdAndUpdate(driver._id, { $set: { fcmToken: req.body.fcmToken } });
        res.setHeader('Authorization', `Bearer ${token}`);
  
        res.status(200).json({ data: token, message: "logged in successfully" });
      } catch (error) {
        res.status(500).send({ message: "Some error happened" + error });
      }
    },

    getDriverById: async (req, res) => {
      try {
        const driver = await Driver.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(req.params.id),
            },
          },
          {
            $lookup: {
              from: 'bookings',
              localField: 'scannedBookings',
              foreignField: '_id',
              as: 'scannedBookings',
            },
          },
          {
            $unwind: {
              path: '$scannedBookings',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'tickets',
              localField: 'scannedBookings.ticket',
              foreignField: '_id',
              as: 'scannedBookings.ticket',
            },
          },
          {
            $unwind: {
              path: '$scannedBookings.ticket',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'lines',
              localField: 'scannedBookings.ticket.lineCode',
              foreignField: '_id',
              as: 'scannedBookings.ticket.lineCode',
            },
          },
          {
            $unwind: {
              path: '$scannedBookings.ticket.lineCode',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: '$_id',
              scannedBookings: { $push: '$scannedBookings' },
              lines: { $first: '$lines' },
            },
          },
        ]).exec();

        res.status(200).json(driver[0]); 
      } catch (error) {
        console.log(error)
        res.status(500).json(error);
      }
    },


    deleteDriver: async (req,res) => {
        try {
            const deletedDrivers = await Driver.findByIdAndRemove(req.params.id);
            res.status(200).json("driver deleted");
        } catch (error) {
            res.status(500).json(error)
        }
    },

    editDriver: async (req, res) => {
      try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
          return res.status(404).json({ message: 'Driver not found' });
        }
    
        const editedData = {
          name: req.body.name || driver.name,
          email: req.body.email || driver.email,
          password: driver.password,
          code: req.body.code || driver.code,
          lines: req.body.lines || driver.lines,
          scannedBookings: driver.scannedBookings
        };
    
        const edited = await Driver.findByIdAndUpdate(req.params.id, editedData);
        
        res.status(200).json(edited);
      } catch (error) {
        res.status(500).json(error);
      }
    },

    
    scanBooking: async (req, res) => {
      try {
          const driverID = req.params.driverID;
          const bookingID = req.params.bookingID;
          const passengerID = req.params.passengerID;
      
          const driver = await Driver.findById(driverID).populate('lines');
          const booking = await Booking.findById(bookingID).populate({
            path: 'ticket',
            populate: {
              path: 'lineCode',
            },
          });
      
          if (!booking) {
            return res.status(401).json("Rezervimi eshte anuluar ose nuk egziston!");
          }
          console.log(booking)
      
          if (!driver) {
            return res.status(401).json("Ju nuk jeni i autorizuar për të skenuar këtë biletë.");
          }
      
          const passenger = booking.passengers.find(p => p._id === passengerID);

          if (!passenger) {
              return res.status(404).json("Passenger not found.");
          }
          
          if (passenger.isScanned) {
              return res.status(410).json("Bileta është skenuar më parë.");
          }
          
          let isLineMatched = false;
          for (const line of driver.lines) {
            if (line === booking.ticket.lineCode) {
              isLineMatched = true;
              break;
            }
          }
      
          if (!isLineMatched) {
            return res.status(400).json(
              `Linja e biletës (${booking.ticket.lineCode.code}) nuk përputhet me linjën e shoferit. Ju lutemi verifikoni nëse keni hypur në autobusin e duhur.`,
            );
          } else {
            if (!passenger) {
                return res.status(404).json("Passenger not found.");
            }
            
            await Booking.updateOne(
                { _id: bookingID, "passenger._id": passengerID },
                { $set: { "passenger.$.isScanned": true } }
            );
            
            await Driver.findByIdAndUpdate(driverID, { $push: { scannedBookings: bookingID } });
            
            return res.status(200).json("Ticket successfully scanned.");
            
          }
        } catch (error) {
          console.log(error)
          requestInProgress = false; 
          res.status(500).json("Gabim i brendshëm i serverit.");
        }
    },
      
    
}