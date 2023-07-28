const mongoose = require("mongoose");

const ticketSchema = mongoose.Schema({
  
  lineCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Line',
  },
  changes: 
    {
      city: {
        type: String,
      },
      date: {
        type: String,
      },
      time: {
        type: String,
      },
    },
    
  date: {
    type: String,
    required: true,
  },
  returnDate: {
    type: String,
  },
  time: {
    type: String,
    required: true,
  },
  returnTime: {
    type: String,
  },
  type: {
    type: String,
    enum: ["oneWay", "return"],
    default: "return",
  },
  numberOfTickets: {
    type: Number,
    default: 48,
  },
  numberOfReturnTickets: {
    type: Number,
    default: 48,
  },
  price: {
    type: Number,
    required: true,
  },
  childrenPrice: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    enum: ['true', 'false'],
    default: false
  },

}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
