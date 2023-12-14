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
  console.log({birthDate});
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
  const stop = ticket?.stops?.find(s => s.from.some(cityInfo => cityInfo.code === from) && s.to.some(t => t.code === to));
  if (stop) {
    return stop.price;
  } else {
    return "Price not found";
  }
};

const findChildrenPrice = (ticket, from, to) => {
  console.log({from, to});
  const stop = ticket?.stops?.find(s => s.from.some(cityInfo => cityInfo.code === from) && s.to.some(t => t.code === to));
  if (stop) {
    return stop.childrenPrice;
  } else {
    return "Children Price not found";
  }
};


const findTime = (ticket, from, to) => {
  const stop = ticket?.stops?.find(
    (s) =>
      s.from.some((cityInfo) => cityInfo.code === from) &&
      s.to.some((t) => t.code === to)
  );
  if (stop) {
    return stop.time;
  } else {
    return "Time not found";
  }
};

const findDate = (ticket, from, to) => {
  const stop = ticket.stops.find(
    (s) =>
      s.from.some((cityInfo) => cityInfo.code === from) &&
      s.to.some((t) => t.code === to)
  );
  if (stop) {
    return stop.date;
  } else {
    return "Date not found";
  }
};

function detectPayment(ticket, isPaid) {
  const firstStop = ticket.stops[0];

  if (firstStop) {
    const currentTime = new Date();
    const firstStopTime = new Date(firstStop.date); 
    const timeComponents = firstStop.time.split(':');
    
    firstStopTime.setHours(parseInt(timeComponents[0], 10));
    firstStopTime.setMinutes(parseInt(timeComponents[1], 10));
    
    console.log({ firstStop, currentTime, firstStopTime });
    console.log({difference: firstStopTime.getTime(), difference2: currentTime.getTime(), diff: firstStopTime.getTime() - currentTime.getTime(), time: 24 * 60 * 60 * 1000})

    if (firstStopTime.getTime() - currentTime.getTime() < 24 * 60 * 60 * 1000) {
      return true;
    }
  }

  if (isPaid) {
    return true;
  }

  return false;
}



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
            percentage: req.body.percentage ? req.body.percentage : agency.percentage,
            city: req.body.city || agency.city,
            country: req.body.country || agency.country,
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
          console.log({body: req.body})
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
          const { from, to } = req.query;
          console.log(req.query)

          const agencySales = await Booking.aggregate([
            {
              $match: {
                createdAt: { $gte: new Date(from), $lte: new Date(to) },
                seller: { $ne: null },
              },
            },
            {
              $group: {
                _id: '$seller',
                totalSales: { $sum: '$price' }, 
              },
            },
          ]);
      

          const agenciesInDebt = await Agency.find({ _id: { $in: agencySales.map((item) => item._id) } })
            .select('-password')
            .lean();
      
          const result = agenciesInDebt.map((agency) => {
            const agencySale = agencySales.find((item) => item._id.equals(agency._id));
            const agencyDebt = (agencySale ? agencySale.totalSales : 0) * (agency.percentage / 100);
            return {
              ...agency,
              totalSales: agencySale ? agencySale.totalSales : 0,
              debt: agencyDebt,
            };
          });
      
          res.status(200).json(result);
        } catch (error) {
          res.status(500).json({ error: `Server error -> ${error.message}` });
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
        console.log({ceo: ceo[0]})
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
      

      const distinctTicketIds = await Ticket.distinct('_id', {
        $or: [
          {
            'stops.from.code': req.query.from,
            'stops.to.code': req.query.to,
          }
        ]
      });

      const query = {
        $match: {
          _id: { $in: distinctTicketIds },
          date: { $gte: fromDate, $lte: toDate },
          numberOfTickets: { $gt: 0 },
          isActive: true
        }
      }
      
      console.log(query);

      const uniqueTickets = await Ticket.aggregate([
        query,
        {
          $sort: { date: 1 },
        },
      ])

      if(uniqueTickets.length == 0) {
        return res.status(204).json("no routes found");
      }

        return res.status(200).json(uniqueTickets);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' + error });
    }
  },

  confirmBookingPayment: async (req,res) => {
    try {
        const { id,agency_id } = req.params;
        const agency = await Agency.findById(agency_id);
        const booking = await Booking.findByIdAndUpdate(id, { $set: { isPaid: true } });
        const destination = { from: booking.from, to: booking.to };
        const dateTime = { date: booking.date, time: findTime(booking.ticket, req.body.from, req.body.to) };
        await generateQRCode(booking._id.toString(), booking.passengers, destination, dateTime, booking.ticket?.lineCode?.freeLuggages);
        const agencyPercentage = agency.percentage / 100;
        const agencyEarnings = (booking.price * agencyPercentage);
        agency.debt += agencyEarnings;
        await agency.save();

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
      const agency = await Agency.findById(req.params.sellerID);
      const ceo = await Ceo.aggregate([{$match: {}}]);
      const ticket = await Ticket.findById(req.params.ticketID).populate("lineCode");
      
      
      let totalPrice = 0;
      const passengers = req.body.passengers?.map((passenger) => {
        const age = calculateAge(passenger.birthDate);
        const passengerPrice = age <= 10 ? findChildrenPrice(ticket, req.body.from.code, req.body.to.code) : findPrice(ticket, req.body.from.code, req.body.to.code);
        totalPrice += passengerPrice + (ticket?.lineCode?.luggagePrice * passenger.numberOfLuggages);
        return {
          email: passenger.email,
          phone: passenger.phone,
          fullName: passenger.fullName,
          birthDate: passenger.birthdate,
          age: calculateAge(passenger.birthDate),
          price: passengerPrice,
          numberOfLuggages: passenger.numberOfLuggages,
          luggagePrice: ticket?.lineCode?.luggagePrice * passenger.numberOfLuggages,
        };
      });
      
      const agencyPercentage = agency.percentage / 100;
      const agencyEarnings = (totalPrice * agencyPercentage);
      const ourEarnings = totalPrice - agencyEarnings;


      const newBooking = await new Booking({
        seller: agency?._id,
        ticket: req.params.ticketID,
        date: findDate(ticket, req.body.from.code, req.body.to.code),
        from: req.body.from.value,
        to: req.body.to.value,
        fromCode: req.body.from.code,
        toCode: req.body.to.code,
        price: totalPrice,
        passengers: passengers,
        isPaid: detectPayment(ticket, req.body.isPaid)
      })


      await newBooking.save().then(async () => {
          await Ticket.findByIdAndUpdate(req.params.ticketID, {
            $inc: { numberOfTickets: -1 },
          });
  
        if(detectPayment(ticket, req.body.isPaid)) {
          await Agency.findByIdAndUpdate(req.params.sellerID, {
            $inc: { totalSales: 1, profit: agencyEarnings, debt: ourEarnings },
          });
        }
      });
  
      const destination = { from: req.body.from.value, to: req.body.to.value };
      const dateTime = { date: ticket.date, time: findTime(ticket, req.body.from.code, req.body.to.code) };
      const dateString = findDate(ticket, req.body.from.code, req.body.to.code)
      console.log({dateString})

      if(detectPayment(ticket, req.body.isPaid)){
        await generateQRCode(newBooking._id.toString(), newBooking.passengers, destination, dateTime,new Date(dateString).toDateString(), ticket?.lineCode?.freeLuggages);
      }
      res.status(200).json(newBooking);
    } catch (error) {
      console.log(error);
      return res.status(500).json(`error -> ${error}`);
    }
  },

  applyForCollaboration: async (req,res) =>{
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req?.body?.password, salt);
      console.log({hashedPassword, salt, body: req.body, files: req.file})
      console.log(req.session.cookie);

      const newAgency = new Agency({
          name: req.body.companyName,
          email: req.body.email,
          password: hashedPassword,
          company_id: req.body.companyID,
          address: req.body.address,
          vat: req.body.vatNumber,
          isApplicant: true,
          isActive: false,
      })

      await newAgency.save();

      res.status(201).json(newAgency);

  } catch (error) {
      console.error(error);
      res.status(500).json(error)
  }
  },

}
