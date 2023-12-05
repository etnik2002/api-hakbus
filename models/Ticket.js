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
  stops: [
    {
      from: [
        {
          city: { type: String },
          code: { type: String },
          country: { type: String },
          lat: { type: Number },
          lng: { type: Number },
          code: { type: String },
        }
      ],
      to: [
        {
          city: { type: String },
          code: { type: String },
          country: { type: String },
          lat: { type: Number },
          lng: { type: Number },
          code: { type: String },
        }
      ],
      time: { type: String },
      date: { type: String }, 
      price: { type: Number },
      childrenPrice: { type: Number },
    }
  ],
  date: {
    type: String,
  },
  time: {
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
  isActive: {
    type: Boolean,
    enum: ['true', 'false'],
    default: true
  },
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
