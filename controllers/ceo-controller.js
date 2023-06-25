const Agency = require("../models/Agency");
const Booking = require("../models/Booking");
const Ceo = require("../models/Ceo");
const City = require("../models/City");
const Ticket = require("../models/Ticket");
const bcrypt = require('bcrypt')

module.exports = {
    createCeo :  async (req,res) => {
        try {
            const hashedPassword = await bcrypt.hashSync(req.body.password, 10);

            const newCeo = new Ceo({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            })

            await newCeo.save();

            res.status(200).json(`successfully created the new ceo -> ${newCeo}`);

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

      getStats : async(req,res) => {
        try {
          const allAgencies = await Agency.find({});
          const allTickets = await Ticket.find({});
          const soldTickets = await Booking.find({});
          const activeCities = await City.find({});

          var totalProfit = 0;
          allAgencies.map((a)=>{
            if(a.profit>0){
              totalProfit+=a.profit;
            }
          })
          res.status(200).json({allAgencies:allAgencies.length,allTickets:allTickets.length,soldTickets:soldTickets.length,totalProfit:totalProfit,activeCities:activeCities.length} )
        } catch (error) {
          res.status(500).send({ message: "Some error happened" + error });
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
            await Agency.findByIdAndUpdate(req.params.id,{$set:{isActive:true}})
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
          const newCity = new City({
            name:req.body.name,

          })
          await newCity.save();
          res.status(200).json('New city created')
        } catch (error) {
          res.status(500).send({ message: "Some error happened" + error });
        }
      },

      getAllCities : async(req,res)=> {
        try {
          const allCities = await City.find({})
          res.status(200).json(allCities)
        } catch (error) {
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

}