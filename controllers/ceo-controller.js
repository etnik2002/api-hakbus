require("dotenv").config()
const { sendAttachmentToOneForAll } = require("../helpers/mail");
const Agency = require("../models/Agency");
const Booking = require("../models/Booking");
const Ceo = require("../models/Ceo");
const City = require("../models/City");
const Ticket = require("../models/Ticket");
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")

module.exports = {
    createCeo :  async (req,res) => {
        try {
          console.log(req.body);
          const salt = bcrypt.genSaltSync(10);
          const hashedPassword = bcrypt.hashSync(req.body.password, salt);        

            const newCeo = new Ceo({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                role: req.body.role ? req.body.role : 'ceo',  
                access: req.body.access
            })

            await newCeo.save();

            res.status(200).json(`successfully created the new ceo -> ${newCeo}`);

        } catch (error) {
            console.error(error);
            res.status(500).json(error)
        }
    },

    getObserverById: async (req,res) => {
      try {
        const observer = await Ceo.findById(req.params.id);
        return res.status(200).json(observer);
      } catch (error) {
        console.error(error);
        res.status(500).json(error)
      }
    },

    editObserver: async (req,res) => {
      try {
        const hashedPassword = await bcrypt.hashSync(req.body.password, 10);
        const observer = await Ceo.findById(req.params.id);
        const editPayload = {
          name: req.body.name || observer.name,
          email: req.body.email ||observer.email,
          password: hashedPassword || observer.password,
          access:req.body.access || observer.access
        }
        
        const updated = await Ceo.findByIdAndUpdate(observer._id, editPayload);
        return res.status(200).json(updated);
      } catch (error) {
        console.error(error);
        res.status(500).json(error)
      }
    },

    login: async (req, res) => {
        try {
    
          const ceo = await Ceo.findOne({ email: req.body.email });
          if (!ceo) {
            return res.status(401).json({ message: "Invalid Email " });
          }
          
    
          const validPassword = await bcrypt.compare(
            req.body.password,
            ceo.password
          );
    
          if (!validPassword) {
            return res.status(401).json({ data: null, message: "Invalid  Password" });
          }
    
          const token = ceo.generateAuthToken(ceo);
          res.setHeader('Authorization', `Bearer ${token}`);
    
          res.status(200).json({ data: token, message: "logged in successfully" });
        } catch (error) {
          res.status(500).send({ message: "Some error happened" + error });
        }
      },

      getAllObservers: async (req,res) => {
        try {
          const obs = await Ceo.aggregate([{$match: { role: 'observer' }}])
          return res.status(200).json(obs)
        } catch (error) {
          res.status(500).json(error);
        }
      },

      deleteObs: async (req,res) => {
        try {
          await Ceo.findByIdAndRemove(req.params.id);
          return res.status(200).json("deleted successfully")
        } catch (error) {
          res.status(500).json(error);
        }
      },

      getCeoById: async (req,res) => {
        try {
          const ceo = await Ceo.findById(req.params.id).populate('notifications.agency_id');
          res.status(200).json(ceo);
        } catch (error) {
          res.status(500).json(error);
        }
      },

      getStats : async(req,res) => {
        try {
          const [allAgencies, allTickets, soldTicketsCount, activeCities, ceo, numberOfAgencies] = await Promise.all([
            Agency.aggregate([
              { $sort: { totalSales: -1 } },
              { $limit: 3 },
            ]),
            Ticket.aggregate([
              { $count: 'totalTickets' },
            ]),
            Booking.aggregate([
              { $count: 'totalSoldTickets' },
            ]),
            City.aggregate([
              { $count: 'totalActiveCities' },
            ]),
            Ceo.findOne({}, { totalProfit: 1 }),
            Agency.countDocuments([{ $match: {} }])
          ]);
      
          console.log(numberOfAgencies)

          const totalAgencies = allAgencies.length;
          const totalTickets = allTickets.length > 0 ? allTickets[0].totalTickets : 0;
          const soldTickets = soldTicketsCount.length > 0 ? soldTicketsCount[0].totalSoldTickets : 0;
          const totalActiveCities = activeCities.length > 0 ? activeCities[0].totalActiveCities : 0;
      
          res.status(200).json({
            allAgencies,
            allTickets: totalTickets,
            soldTickets,
            totalProfit: ceo.totalProfit,
            activeCities: totalActiveCities,
            totalAgencies,
            numberOfAgencies,
          });
        } catch (error) {
          res.status(500).send({ message: 'Some error happened ' + error });
        }
      },

      deactivateAgency : async(req,res) => {
          try {
            await Agency.findByIdAndUpdate(req.params.id,{$set:{isActive:false}})
            res.status(200).json({message: "Succesfully deactivated"})
          } catch (error) {
            res.status(500).send({ message: "Some error happened" + error });
          }
      },

      activateAgency : async(req,res) => {
          try {
            await Agency.findByIdAndUpdate(req.params.id,{$set:{isActive:true, isApplicant: false}})
            res.status(200).json({message: "Succesfully activated"})
          } catch (error) {
            res.status(500).send({ message: "Some error happened" + error });
          }
      },

      addCity : async(req,res) => {
        try {
          const city= await City.find({name:req.body.name})
          if (city.length>0){
            return res.status(400).json('Qyteti egziston');
          }
          const googleMapsUrl = req.body.mapUrl;

          const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
          const match = googleMapsUrl.match(regex);

          var latitude = 0;
          var longitude = 0;
          if (match) {
            latitude = match[1];
            longitude = match[2];

            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);
          } else {
            console.log("Coordinates not found in the URL");
          }


          const newCity = new City({
            name: req.body.name,
            country: req.body.country,
            lat: latitude,
            lng: longitude,
            code: req.body.cityCode,
          })
          
          console.log(newCity)
          await newCity.save();
          res.status(200).json('New city created')
        } catch (error) {
          res.status(500).send({ message: "Some error happened" + error });
        }
      },

      importCitiesFromExcel: async (req,res) => {
        try {
          console.log(req.file);
          return res.status(201).json("in construction")
        } catch (error) {
          
          console.log(error);
          res.status(500).send({ message: "Some error happened" + error });
        }
      },

      getAllCitiesPagination: async (req, res) => {
        try {
          const page = parseInt(req.query.page) || 0;
          const size = parseInt(req.query.size) || 10;
      
          const pipeline = [
            { $match: {} }, 
            // { $skip: (page) * size }, 
            // { $limit: size }, 
          ];
      
          const allCities = await City.aggregate(pipeline);
          res.status(200).json(allCities);
        } catch (error) {
          console.log(error);
          res.status(500).send({ message: "Some error happened" + error });
        }
      },

      getAllCities: async (req,res) => {
        try {
          const pipeline = [
            { $match: {} }, 
          ];
      
          const allCities = await City.aggregate(pipeline);
          console.log("req came")
          res.status(200).json(allCities);
        } catch (error) {
          console.log(error);
          res.status(500).send({ message: "Some error happened" + error });
        }
      },
      


      deleteCity: async (req, res) => {
        try {
          const deletCity = await City.findByIdAndRemove(req.params.id);
          res.status(200).json({ message: "Qyteti u fshi me sukses"});
        } catch (error) {
          res.status(500).json("error -> " + error);
        }
      },

        confirmDebtPayment: async (req, res) => {
          try {
            const { debt } = req.body;
            const debtValue = parseFloat(debt);
            const agency = await Agency.findById(req.params.id);
            const ceo = await Ceo.find({});

            const paidDebt = await Agency.findByIdAndUpdate(req.params.id, { $inc: { debt: -debtValue } });
        
            if (paidDebt) {
              const notificationIndex = ceo[0].notifications.findIndex(notification => notification._id.toString() === req.params.notificationId);
        
              if (notificationIndex !== -1) {
                ceo[0].notifications[notificationIndex].confirmed = true;
                await ceo[0].save();
              } else {
                return res.status(404).json('Notification not found.');
              }
            } else {
              return res.status(404).json('Agency not found.');
            }
        
            res.status(200).json(`Pagesa e borxhit per ${agency.name} me vlere ${debtValue} € u konfirmua me sukses.`);
          } catch (error) {
            return res.status(500).json(error);
          }
      },

      changeEmail: async (req,res) => {
        try {
          console.log(req.params);
          const ceo = await Ceo.findById(req.params.id);
          ceo.email = req.body.email;
          await ceo.save();
          ceo.password = undefined;
          const ceoPayload = {
            ...ceo,
            password: undefined,
          }
          console.log(ceoPayload);

          const token = jwt.sign(ceoPayload, process.env.OUR_SECRET);
          return res.status(200).json(token);
        } catch (error) {
          console.log(error);
          return res.status(500).json(error);
        }
      },

      changePin: async (req,res) => {
        try {
          console.log(req.params);
          const ceo = await Ceo.findById(req.params.id);
          ceo.deletionPin = req.body.pin;
          await ceo.save();
          return res.status(200).json("Pin changed");
        } catch (error) {
          console.log(error);
          return res.status(500).json(error);
        }
      },

      changePassword: async (req,res) => {
        try {
          const ceo = await Ceo.findById(req.params.id);
          const { oldPassword, newPassword } = req.body;
          const passwordMatches = await bcrypt.compare(oldPassword, ceo.password);
          console.log(passwordMatches);
          if(!passwordMatches) return res.status(401).json("wrong old password");
          const salt = await bcrypt.genSaltSync(10);
          const hashedPassword = await bcrypt.hashSync(newPassword, salt);
          console.log(hashedPassword);
          ceo.email = req.body.email;
          ceo.password = hashedPassword;
          await ceo.save();
          const ceoPayload = {
            ...ceo,
            password: undefined,
          }

          const token = jwt.sign(ceoPayload, process.env.OUR_SECRET);
          return res.status(200).json(token);
        } catch (error) {
          console.log(error);
          return res.status(500).json(error);
        }
      },

      setNrOfSeatsNotification: async (req,res) => {
        try {
          const ceo = await Ceo.find({}).limit(1);
          ceo[0].nrOfSeatsNotification = req.body.number;
          await ceo[0].save();
          ceo[0].password = undefined;
          const ceoPayload = {
            ...ceo[0],
            password: undefined,
          }
          console.log(ceoPayload);
          const token = jwt.sign(ceoPayload, process.env.OUR_SECRET);
          return res.status(200).json(token);
        } catch (error) {
          console.log(error)
          return res.status(500).json(error);
        }
      },

      
  sendBookingToEmail: async (req, res) => {
    try {
        const { receiverEmail, bookingID } = req.body;
        const attachments = req.files;
        const booking = await Booking.findById(bookingID);

        console.log({body:req.body})
        

        const sentEmails = await sendAttachmentToOneForAll(receiverEmail, booking.passengers, attachments);
        
        return res.status(200).json(`Dokumentet u dërguan ne emailin: ${receiverEmail} për ${booking.passengers.length} ${booking.passengers.length > 1 ? 'udhëtarë' : 'udhëtar'} !`);
        

    } catch (error) {
        console.log({"Erroriiii: ": error})
        res.status(500).json('error -> ' + error)
    }
  },

}