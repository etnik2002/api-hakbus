const Agency = require("../models/Agency");
const moment = require('moment')
const Ticket = require("../models/Ticket");
const Booking = require("../models/Booking");
const bcrypt = require("bcrypt");
const Token = require("../models/ScannerToken");
const Ceo = require("../models/Ceo");
const { sendAttachmentToAllPassengers, sendAttachmentToOneForAll, generateQRCode } = require("../helpers/mail");
const mongoose = require("mongoose");
const City = require("../models/City");


function calculateAge(birthDate) {
  const today = new Date();
  const birthDateArray = birthDate.split("-"); 
  const birthDateObj = new Date(
    birthDateArray[2],
    birthDateArray[1] - 1,
    birthDateArray[0]
  );
 
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    age -= 1;
  }

  return age;
}


const findPrice = (ticket, from, to) => {
  const stop = ticket?.stops.find(
    (s) =>
      (s.from[0]?.city === from && s.to.some((t) => t.city === to)) ||
      (s.from[0]?.city === to && s.to.some((t) => t.city === from))
  );

  return stop ? stop.price : null;
};

const findChildrenPrice = (ticket, from, to) => {
  const stop = ticket?.stops.find(
    (s) =>
      (s.from[0]?.city === from && s.to.some((t) => t.city === to)) ||
      (s.from[0]?.city === to && s.to.some((t) => t.city === from))
  );

  return stop ? stop.childrenPrice : null;
};


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
                city:req.body.city,
                country:req.body.country,
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

      getAgencySales: async (req, res) => {
        try {
            const { id } = req.params;
            const fromDate = req.query.fromDate;
            const toDate = req.query.toDate;

            const filteredBookings = await Booking.find({
                seller: id,
                createdAt: { $gte: fromDate, $lte: toDate }
            })
              .populate({
                path: 'buyer',
                select: '-password' 
              })
              .populate({
                path: 'ticket',
                populate: { path: 'lineCode' } 
              }).populate({
                path: 'seller',
                select: '-password'
              })
              .sort({ createdAt: 'desc' });

            res.status(200).json(filteredBookings);
        } catch (error) {
            console.error(error); 
            res.status(500).json({ error: 'An error occurred while fetching agency sales.' });
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
            let page = Number(req.query.page) || 1;
            let size = Number(req.query.size) || 10; 
          
            const skipCount = (page - 1) * size;
          
            const soldTickets = await Booking.find({ seller: req.params.id })
              .populate({
                path: 'seller buyer ticket',
                select: '-password'
              })
              .sort({ createdAt: 'desc' })
              .skip(skipCount)
              .limit(size);
          
            res.status(200).json(soldTickets);
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

  payDebt: async (req, res) => {
    try {
        const { debt } = req.body;
        const debtValue = parseFloat(debt);
        const agency = await Agency.findById(req.params.id);

        if (agency.debt < 1) {
            return res.status(403).json("Agjencioni nuk ka borxhe!");
        }
        if (debt < 1) {
            return res.status(403).json("Ju lutemi shkruani nje numer valid");
        }
        if (debt > agency.debt) {
            return res.status(403).json("Shuma e pageses eshte me e madhe se borxhi!");
        }

        // await Agency.findByIdAndUpdate(req.params.id, { $inc: { debt: -debtValue } });

        const ceo = await Ceo.find({});

        const newNotification = {
            message: `${agency.name} po paguan borxh prej ${debt} €. Borxhi duhet te konfirmohet ne menyre qe te perditesohet ne dashboardin e agjencionit`,
            title: `Pagese borxhi`,
            agency_id: agency._id,
            value: debtValue,
            confirmed: false,
        };
        
        await Ceo.findByIdAndUpdate(ceo[0]._id, { $push: { notifications: newNotification } });
        res.status(200).json("Kerkesa per pages te borxhit u dergua tek HakBus, konfirmimi do te behet nga ana e kompanise pasi qe ju ti dergoni parate. Ju faleminderit?");

    } catch (error) {
        res.status(500).json(error);
    }

  },

  getSearchedTickets : async (req, res) => {
    try {
      const fromDate =  moment(req.query.fromDate).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
      const toDate = moment(req.query.toDate).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
      

      const cities = await City.find({
        $or: [
          {
            name: req.query.from,
          },
          {
            name: req.query.to,
          }
        ]
      })

      const distinctTicketIds = await Ticket.distinct('_id', {
        $or: [
          {
            'stops.from.city': req.query.from,
            'stops.to.city': req.query.to,
          },
          {
            'stops.from.city': req.query.to,
            'stops.to.city': req.query.from,
          },
        ],
      });
      
      const uniqueTickets = await Ticket.find({_id: { $in: distinctTicketIds }, date: { $gte: fromDate, $lte: toDate }, numberOfTickets: { $gt: 0 }}).populate('lineCode');
      
      return res.status(200).json(uniqueTickets);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' + error });
    }
  },

  confirmBookingPayment: async (req,res) => {
    try {
        const { id } = req.params;
        await Booking.findByIdAndUpdate(id, { $set: { isPaid: true } });
        res.status(200).json("Successfully confirmed payment"); 

    } catch (error) {
        res.status(500).json('error -> ' + error)
    }
  },    

  sendBookingAttachment: async (req, res) => {
    try {
        const { sendSepparately, sendToOneEmail, receiverEmail, bookingID } = req.body;
        const attachments = req.files;
        const booking = await Booking.findById(bookingID);

        console.log({body:req.body})
        if (sendSepparately==='true') {
          console.log({sendSepparately})
            await sendAttachmentToAllPassengers( booking.passengers, attachments );
            return res.status(200).json("Dokumentet u dërguan tek secili pasagjer veçmas!")
        } 
        
        if(sendToOneEmail==='true') {
          console.log({sendToOneEmail})
            const isArray = Array.isArray(attachments)
            await sendAttachmentToOneForAll(receiverEmail, booking.passengers, attachments);
            return res.status(200).json(`Dokumentet u dërguan te ${receiverEmail} për ${booking.passengers.length} ${booking.passengers.length > 1 ? 'udhëtarë' : 'udhëtar'} !`);
        }
        
        return res.status(200).json("successfully sent attachments " + attachments)

    } catch (error) {
        console.log(error)
        res.status(500).json('error -> ' + error)
    }
  },

  makeBookingForCustomers: async (req,res) => {
    try {
      console.log(req.params)
      const agency = await Agency.findById(req.params.sellerID);
      const ceo = await Ceo.aggregate([{$match: {}}]);
      const type = req.body.type;
      const ticket = await Ticket.findById(req.params.ticketID);
      
      
      let totalPrice = req.body.ticketPrice;
      const passengers = req.body.passengers?.map((passenger) => {
        const age = calculateAge(passenger.birthdate);
        const passengerPrice = age <= 10 ? findChildrenPrice(ticket, req.body.from, req.body.to) : findPrice(ticket, req.body.from, req.body.to);
        console.log({passenger, passengerPrice})
        return {
          email: passenger.email,
          phone: passenger.phone,
          fullName: passenger.fullName,
          birthDate: passenger.birthdate,
          age: calculateAge(passenger.birthdate),
          price: passengerPrice,
        };
      });
      
      const agencyPercentage = agency.percentage / 100;
      const agencyEarnings = (totalPrice * agencyPercentage);
      const ourEarnings = req.body.ticketPrice - agencyEarnings;
      const sendEmailNotification = req.body.sendEmailNotification;
      const sendSmsNotification = req.body.sendSmsNotification;

      const newBooking = await new Booking({
        seller: agency?._id,
        ticket: req.params.ticketID,
        from: req.body.from,
        to: req.body.to,
        price: req.body.ticketPrice,
        passengers: passengers,
        isPaid: true
      })

      await newBooking.save().then(async () => {
          await Ticket.findByIdAndUpdate(req.params.ticketID, {
            $inc: { numberOfTickets: -1 },
          });
  
          console.log({ourEarnings})
        await Agency.findByIdAndUpdate(req.params.sellerID, {
          $inc: { totalSales: 1, profit: agencyEarnings, debt: ourEarnings },
        });
  
        await Ceo.findByIdAndUpdate(ceo[0]._id, { $inc: { totalProfit: ourEarnings } });
      });
  
      await generateQRCode(newBooking._id.toString(), req.body.passengers);


      if (sendEmailNotification) {
        passengers.forEach(async (passenger) => {
          await sendOrderToUsersEmail(passenger.email || user.email , ticket, '6499b15485cb1e6f21a34a46', 'HakBus customer', passenger.fullName, totalPrice, bookingType);
        }).then((res) => {
          // console.log(res)
        }).catch((err) => {
          console.log(err)
        })
      }

      var seatNotification = {};

      if(ticket.numberOfReturnTickets <= ceo[0].nrOfSeatsNotification + 1) {
        seatNotification = {
          message: `Kanë mbetur vetëm 2 vende të lira për linjën  (${ticket.to} / ${ticket.from}) me datë ${ticket.returnDate}`,
          title: `2 ulëse të mbetura`,
          ticket_id: ticket._id,
          link: `${process.env.FRONTEND_URL}/ticket/edit/${ticket.id}`,
          confirmed: false,
        };
        await Ceo.findByIdAndUpdate(ceo[0]._id, { $push: { notifications: seatNotification } });
      } else if (ticket.numberOfTickets <= ceo[0].nrOfSeatsNotification + 1) {
        seatNotification = {
          message: `Kanë mbetur vetëm 2 vende të lira për linjën (${ticket.from} / ${ticket.to}) me datë ${ticket.date}`,
          title: `2 ulëse të mbetura`,
          ticket_id: ticket._id,
          link: `${process.env.FRONTEND_URL}/ticket/edit/${ticket.id}`,
          confirmed: false,
        };
        await Ceo.findByIdAndUpdate(ceo[0]._id, { $push: { notifications: seatNotification } });
      }

      const createdBooking = await Booking.findById(newBooking._id).populate('ticket seller')

      console.log(createdBooking)
      res.status(200).json(createdBooking);
    } catch (error) {
      return res.status(500).json(`error -> ${error}`);
    }
  },

  applyForCollaboration: async (req,res) =>{
    try {
      console.log(req.body)
      // const hashedPassword = await bcrypt.hashSync(req.body.password, 10);

      const newAgency = new Agency({
          name: req.body.name,
          email: req.body.email,
          company_id: req.body.company_id,
          address: req.body.address,
          vat: req.body.vat,
          isApplicant: true,
          isActive: false,
      })

      await newAgency.save();

      res.status(200).json(newAgency);

  } catch (error) {
      console.error(error);
      res.status(500).json(error)
  }
  },

}
