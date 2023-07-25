const Driver = require('../models/Driver');
const Booking = require('../models/Booking');


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
            const drivers = await Driver.find({}).populate('scannedBookings lines');
            res.status(200).json(drivers);
        } catch (error) {
            res.status(500).json(error)
        }
    },

    getDriverById: async (req,res) => {
        try {
            const driver = await Driver.findById(req.params.id).populate('scannedBookings lines');
            res.status(200).json(driver);
        } catch (error) {
            res.status(500).json(error)
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
      
          const driver = await Driver.findById(driverID);
          const booking = await Booking.findById(bookingID).populate('ticket');
      
          if (!driver) {
            return res.status(401).json("Ju nuk jeni i autorizuar për të skenuar këtë biletë." );
          }
      
          if (booking.isScanned) {
            return res.status(410).json("Bileta është skenuar më parë." );
          }
      
          let isLineMatched = false;
          for (const line of driver.lines) {
            if (driver.line === booking.ticket.lineCode) {
              isLineMatched = true;
              break;
            }
          }
      
          if (!isLineMatched) {
            return res.status(401).json(
              `Linja e biletës (${booking.ticket.lineCode}) nuk përputhet me linjën e shoferit (${driver.line}). Ju lutemi verifikoni nëse keni hypur në autobusin e duhur.`,
            );
          } else {
            await Booking.findByIdAndUpdate(bookingID, { $set: { isScanned: true } });
            await Driver.findByIdAndUpdate(driverID, { $push: { scannedBookings: bookingID } });
            return res.status(200).json( "Bileta u skanua me sukses.");
          }
        } catch (error) {
          res.status(500).json("Gabim i brendshëm i serverit.");
        }
      },
      
    

    //   scanBookingV2: async (req,res) => {
    //     try {
    //         const driverID = req.params.driverID;
    //         const bookingID = req.params.bookingID;

    //         const driver = await Driver.findById(driverID);
    //         const booking = await Booking.findById(bookingID).populate('ticket');

    //         if(!driver) {
    //             return res.status(401).json("Nuk je i autorizuar per te skenuar kete bilete");
    //         }

    //         if(booking.isScanned) {
    //             return res.status(410).json("Bileta eshte skenuar me pare");
    //         }

    //         for (const line of driver.lines) {
    //             if(driver.line != booking.ticket.lineCode) {
    //                 return res.status(401).send(`Linja e biletes nuk perputhet me linjen e shoferit ${driver.name}, ju lutemi verifikoni nese keni hypur ne autobusin e duhur.`)
    //             } else {
    //                 await Booking.findByIdAndUpdate(bookingID, { $set : { isScanned: true }});
    //             } 
                
    //         }


    //     } catch (error) {
    //         res.status(500).json(error);
    //     }
    // },

}