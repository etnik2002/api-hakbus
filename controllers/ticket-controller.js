const Ticket = require("../models/Ticket");
const Agency = require("../models/Agency");
const moment = require("moment");
const User = require("../models/User");
const TicketService = require("../services/ticketService");
const { default: mongoose } = require("mongoose");



module.exports = {

    registerTicket: async (req, res) => {
      try {
        const selectedDayOfTheWeek = req.body.dayOfWeek;
        const selectedReturnDayOfWeek = req.body.returnDayOfWeek;

        const ticketData = {
          from: req.body.from,
          to: req.body.to,
          lineCode: req.body.lineCode,
          time: req.body.time,
          type: req.body.type,
          numberOfTickets: req.body.numberOfTickets,
          numberOfReturnTickets: req.body.numberOfReturnTickets,
          price: req.body.price,
          childrenPrice: req.body.childrenPrice,
          startLng: req.body.startLng,
          startLat: req.body.startLat,
          endLng: req.body.endLng,
          endLat: req.body.endLat,
          changes: req.body.changes,
        };
    
        const newTicket = new Ticket({
          ...ticketData,
        });
    
        // await newTicket.save();
    
        const generatedTickets = await generateTicketsForNextTwoYears(ticketData, selectedDayOfTheWeek, selectedReturnDayOfWeek);
    
        res.status(200).json({
          newTicket,
          generatedTickets,
        });
      } catch (error) {
        res.status(500).json({ message: "Internal error -> " + error });
      }
    },
    
      getSingleTicket: async (req, res)=>{ 
        try {
          const ticket = await Ticket.findById(req.params.id).populate([
            { path: 'agency', select: '-password' },
            { path: 'lineCode' },
          ]);
            
          if(!ticket) {
                return res.status(404).json({ message: "Ticket not found" });
            }
            res.status(200).json(ticket);
        } catch (error) {
          res.status(500).json({ message: "Internal error -> " + error });
        }
      },
      
      getAllTicket: async (req,res) => {
        try {
          const ticketsService = new TicketService();
          
          await ticketsService.getAllTickets().then((data) => {
            res.status(200).json(data);
          })

        } catch (error) {
          res.status(500).json({ message: "Internal error -> " + error });
        }
      },

      getAllTicketPagination: async (req,res)=>{ 
        try {
          const page= req.query.page || 0;
          const size= req.query.size || 10;
          const all = await Ticket.find({})

            const allTickets = await Ticket.find({})
            console.log(allTickets)
            res.status(200).json({allTickets,all:all.length});
        } catch (error) {
          console.log(error)
          res.status(500).json({ message: "Internal error -> " + error });
        }
      },

      getSearchedTickets: async (req, res) => {
        try {
          let from = req.query.from;
          let to = req.query.to;
          let date = req.query.date;
          let returnDate = req.query.returnDate;
          let type = req.query.type;
          let price = req.body.price;
          let childrenPrice = req.body.childrenPrice;
          
          const dateNow = moment().format('DD-MM-YYYY');

          const searchParams = {};
      
          if (from) searchParams.from = from;
          if (to) searchParams.to = to;
          if (date) searchParams.date = date;
          if (returnDate) searchParams.returnDate = returnDate;
          if (type) searchParams.type = type;
          if (price) searchParams.price = price;
          if (childrenPrice) searchParams.childrenPrice = childrenPrice;
      
          const searchFields = ['from', 'to', 'type', 'date', 'returnDate'];
          const textQuery = searchFields
            .filter((field) => searchParams[field])
            .map((field) => ({
              [field]: { $regex: searchParams[field], $options: 'i' },
            }));
          const ticketQuery = textQuery.length > 0 ? { $or: textQuery } : {};
      
          const allTickets = await Ticket.find({
            ...ticketQuery,
            ...searchParams,
            date: { $gte: dateNow }
          })
            .populate([
              { path: 'agency', select: '-password' },
              { path: 'lineCode' },
            ])
            .sort({ createdAt: 'desc' });
          

          const filteredTickets = allTickets.filter((ticket) =>
            ticket.agency && ticket.agency.isActive
          );
    
          res.status(200).json(filteredTickets);
        } catch (error) {
          res.status(500).json({ message: 'Internal server error -> ' + error });
        }
      },
      
      getNearestTicket: async (req, res) => {
        try {
          const dateNow = moment().format('DD-MM-YYYY');
          const ticket = await Ticket.find({
            from: req.query.from,
            to: req.query.to,
            date: { $gte: dateNow },
          })
            .populate([
              { path: 'agency', select: '-password', match: { isActive: true } },
              { path: 'lineCode' },
            ])

          if (ticket) {
            res.status(200).json(ticket); 
          } else {
            res.status(404).json({ message: 'No nearest ticket found.' }); 
          }
        } catch (error) {
          res.status(500).json({ message: 'Internal server error -> ' + error });
        }
      },

      deleteTicket: async (req, res) => {
        try {
          const deleteTicket = await Ticket.findByIdAndRemove(req.params.id);
          res.status(200).json({ message: "ticket deleted successfully ->  " + deleteTicket });
        } catch (error) {
          console.error(error);
          res.status(500).json("error -> " + error);
        }
      },

      editTicket: async (req, res) => {
        try {
          console.log(req.params.id)
          const ticket = await Ticket.findById(req.params.id);

          if (!ticket) {
            return res.status(404).json("Ticket not found");
          }
      
          const editTicket = {
            from: req.body.from ? req.body.from : ticket.from,
            to: req.body.to ? req.body.to : ticket.to,
            date: req.body.date ? req.body.date : ticket.date,
            time: req.body.time ? req.body.time : ticket.time,
            returnDate: req.body.returnDate ? req.body.returnDate : ticket.returnDate,
            returnTime: req.body.returnTime ? req.body.returnTime : ticket.returnTime,
            numberOfTickets: req.body.numberOfTickets ? req.body.numberOfTickets : ticket.numberOfTickets,
            price: req.body.price ? req.body.price : ticket.price,
            childrenPrice: req.body.childrenPrice ? req.body.childrenPrice : ticket.childrenPrice,
            agency: ticket.agency,
            type: req.body.type ? req.body.type : ticket.type,
          }
      
          const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, editTicket);
          res.status(200).json(updatedTicket);
      
        } catch (error) {
          res.status(500).json("Error -> " + error);
        }
      },
}



const generateTicketsForNextTwoYears = async (ticketData, selectedDayOfWeek, selectedReturnDayOfWeek) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + ((1 + 7 - startDate.getDay()) % selectedDayOfWeek));
  startDate.setHours(8, 0, 0, 0);

  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + ((1 + 7 - returnDate.getDay()) % selectedReturnDayOfWeek));
  returnDate.setHours(8, 0, 0, 0);
  const tickets = [];

  for (let i = 0; i < 2 * 52; i++) {
    const ticketDate = new Date(startDate);
    ticketDate.setDate(ticketDate.getDate() + 7 * i);

    const ticketReturnDate = new Date(returnDate);
    ticketReturnDate.setDate(ticketReturnDate.getDate() + 7 * i);

      const day = String(ticketDate.getDate()).padStart(2, '0');
      const month = String(ticketDate.getMonth() + 1).padStart(2, '0');
      const year = ticketDate.getFullYear();

      const returnday = String(ticketReturnDate.getDate()).padStart(2, '0');
      const returnmonth = String(ticketReturnDate.getMonth() + 1).padStart(2, '0');
      const returnyear = ticketReturnDate.getFullYear();

      const ticketDateString = `${day}-${month}-${year}`;
      const returnTicketDateString = `${returnday}-${returnmonth}-${returnyear}`;

      console.log(ticketDateString, returnTicketDateString)

      const ticketDataWithDate = {
        ...ticketData,
        date: ticketDateString,
        returnDate: returnTicketDateString
      }

      const ticket = new Ticket(ticketDataWithDate);

      ticket.date = ticketDateString;
      ticket.returnDate = returnTicketDateString;

      await ticket.save();
      tickets.push(ticket);
  }

    console.log({ tickets });
    return tickets;
};



// const createTicket = async (ticketData) => {
//   const ticket = new Ticket(ticketData);
//   return ticket.save();
// };

// const generateAllTickets = async () => {
//   const ticketData = {
//     agency: "agencyId", 
//     from: "Start City",
//     to: "End City",
//     lineCode: "lineId",
//     changes: [
//       {
//         city: "Change City",
//         date: "Change Date",
//         time: "Change Time",
//       },
//     ],
//     time: "08:00", 
//     price: 10, 
//     childrenPrice: 5,
//     startLng: 0, 
//     startLat: 0, 
//     endLng: 1, 
//     endLat: 1, 
//   };

//   const startDate = new Date(); 
//   startDate.setDate(startDate.getDate() + ((1 + 7 - startDate.getDay()) % 7));
//   startDate.setHours(8, 0, 0, 0); 

//   const tickets = [];

//   for (let i = 0; i < 3 * 52; i++) {
//     const ticketDate = new Date(startDate);
//     ticketDate.setDate(ticketDate.getDate() + 7 * i); 

//     const ticketDateString = ticketDate.toISOString().substring(0, 10);
//     const ticketDataWithDate = {
//       ...ticketData,
//       date: ticketDateString,
//     };

//     const ticket = await createTicket(ticketDataWithDate);
//     tickets.push(ticket);
//   }

//   return tickets;
// };

// generateAllTickets()
//   .then((tickets) => {
//     console.log("Tickets created:", tickets);
//     mongoose.disconnect();
//   })
//   .catch((error) => {
//     console.error("Error creating tickets:", error);
//     mongoose.disconnect();
//   })
