const Agency = require("../models/Agency");
const Ticket = require("../models/Ticket");
const Booking = require("../models/Booking");
const bcrypt = require("bcrypt");
const Token = require("../models/ScannerToken")

module.exports = {

    createAgency :  async (req,res) => {
        try {
            console.log(req.body)
            const hashedPassword = await bcrypt.hashSync(req.body.password, 10);

            const newAgency = new Agency({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                phone: req.body.phone,
                percentage: req.body.percentage,
                // idc: req.body.idc,
                // scc: req.body.scc,
            })

            await newAgency.save();

            res.status(200).json(newAgency);

        } catch (error) {
            console.error(error);
            res.status(500).json(error)
        }
    },

    loginAsAgency: async (req, res) => {
        try {

            const agency = await Agency.findOne({ email: req.body.email });
            if (!agency) {
                return res.status(401).json({ message: "Invalid Email " });
            }
            if(!agency.isActive) {
                return res.status(403).json('Your account is deactivated, please contact us')
            }
                
            const validPassword = await bcrypt.compare(
                req.body.password,
                agency.password
            );

            if (!validPassword) {
                return res.status(401).json({data: null, message: "Invalid  Password" });
            }

                const token = agency.generateAuthToken(agency);
                res.set('Authorization', `Bearer ${token}`);

                res.status(200).json({ data: token, message: "logged in successfully" });
        } catch (error) {
            res.status(500).send({  message: "Some error happened" + error });
        }
    },

    editAgency: async (req, res) => {
        try {
          const agency = await Agency.findById(req.params.id);
          const hashedPassword = await bcrypt.hashSync(req.body.password, 10);

          const editAgency = {
            name: req.body.name ? req.body.name : agency.name,
            email: req.body.email ? req.body.email : agency.email,
            password: req.body.password ? hashedPassword : agency.password,
            phone: req.body.phone ? req.body.phone : agency.phone,
            percentage: req.body.percentage ? req.body.percentage : agency.percentage
          }
    
          const updatedAgency = await Agency.findByIdAndUpdate(req.params.id, editAgency);
          res.status(200).json(updatedAgency);
    
        } catch (error) {
          res.status(500).json("error -> " + error);
        }
      },

    getAll: async (req, res) => {
        try {
            const all = await Agency.find({}, "-password").sort({createdAt:'desc'});
            res.status(200).json(all)
        } catch (error) {
          res.status(500).send({ message: "Some error happened" + error });
        }
    },

    deleteAgency: async (req, res) => {
        try {
          const deleteAgency = await Agency.findByIdAndRemove(req.params.id);
          res.status(200).json({ message: "Agjencia u fshi me sukses"});
        } catch (error) {
          console.error(error);
          res.status(500).json("error -> " + error);
        }
      },

      getSingleAgency : async (req,res) => {
        try {
            const agency = await Agency.findById(req.params.id);
            res.status(200).json(agency)
        } catch (error) {
          res.status(500).json("error -> " + error);
            
        }
      },

      getAgencyTickets : async(req,res) => {
        try {
          const tickets = await Ticket.find({agency:req.params.id}).sort({createdAt:'desc'})
          res.status(200).json(tickets)
        } catch (error) {
          res.status(500).json("error -> " + error);
        }
      },

      soldTickets : async(req, res) => {
        try {
          const soldTickets = await Booking.find({seller:req.params.id}).populate({
            path: 'seller buyer ticket',
            select: '-password' 
          });
          res.status(200).json(soldTickets)
        } catch (error) {
          res.status(500).json("error -> " + error);
        }
      },
      getAgenciesInDebt: async (req, res) => {
        try {
            const agenciesInDebt = await Agency.find({ debt: { $exists: true, $gt: 0 } }).select('-password');
            console.log(agenciesInDebt);
            res.status(200).json(agenciesInDebt);
        } catch (error) {
            res.status(500).json("error -> " + error);
        }
    },
    
    scanBooking : async (req,res) => {
      try {
          const booking = await Booking.findById(req.params.bookingID);
          console.log(booking);
          
          if(booking.seller != req.params.agencyID) {
              return res.status(401).json("You are not authorized to scan this boking!");
          }
          if(booking.isScanned){
              return res.status(403).json("Booking is already scanned or you are not authorized.")
          } else {
              await Order.findByIdAndUpdate(req.params.bookingID, { $set: { isScanned: true }});
          }

          res.status(200).json( "Booking scanned successfully!" );
  
      } catch (error) {
          res.status(500).json(error);   
      }
  },

  createScanningToken : async (req,res) => {
      try {
          const token = new Token({token: req.params.bookingID,ticket:req.params.ticketID})
          await token.save()
          res.status(200).json("token created");
          
      } catch (error) {
          res.status(500).json(error)
      }
  },

  getToken : async (req,res) => {
      try {
          const all = await Token.find({});
          var token = all[all.length -1];
          res.status(200).json(token)
          
      } catch (error) {
          res.status(500).json(error)
      }
  },

  deleteToken: async (req,res) => {
      try {
          await Token.findByIdAndRemove(req.params.token);
          res.status(200).json("deleted")

      } catch (error) {
          res.status(500).json(error)
      }
  },

  payDebt: async (req,res) => {
    try {
        const { debt } = req.body;
        debtValue = parseFloat(debt);
        const agency = await Agency.findById(req.params.id);

        if(agency.debt < 1) {
          return res.status(403).json("Agjencioni nuk ka borxhe!");
        }
        if(debt < 1) {
          return res.status(403).json("Ju lutemi shkruani nje numer valid");
        }
        if(debt > agency.debt) {
          return res.status(403).json("Shuma e pageses eshte me e madhe se borxhi!");
        }
        
        await Agency.findByIdAndUpdate(req.params.id, { $inc: { debt: -debtValue } });
        res.status(200).json("Borxhi u pagua me sukses");

    } catch (error) {
        res.status(500).json(error);
    }
  },

}