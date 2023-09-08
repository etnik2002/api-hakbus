const mongoose = require("mongoose");

const ticketSchema = mongoose.Schema({
  
  lineCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Line',
  },
  from: {
    type: String,
  },
  to: {
    type: String,
  },
  // changes: 
  //   {
  //     city: {
  //       type: String,
  //     },
  //     date: {
  //       type: String,
  //     },
  //     time: {
  //       type: String,
  //     },
  //   },
  stops: [
    {
      city: { type: String },
      // city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
      time: { type: String },
      price: { type: Number },
    }
  ],
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
    required: true,
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
    default: true
  },

}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
