const mongoose = require("mongoose");


const ticketSchema = mongoose.Schema({
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  returnDate: {
    type: String
  },
  time: {
    type: String,
    required: true
  },
  returnTime: {
    type: String
  },
  type: {
    type: String,
    enum: ['oneWay', 'return'],
    default: 'oneWay'
  },
  numberOfTickets: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  childrenPrice: {
    type: Number,
    required: true
  },
  lng: {
    type: Number
  },
  lat: {
    type: Number
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agency",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
