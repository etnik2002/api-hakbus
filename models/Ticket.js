const mongoose = require("mongoose");

const ticketSchema = mongoose.Schema({
  
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  lineCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Line',
  },
  changes: [
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
  },
  type: {
    type: String,
    enum: ["oneWay", "return"],
    default: "oneWay",
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
  // startLng: {
  //   type: Number,
  //   required: true,
  // },
  // startLat: {
  //   type: Number,
  //   required: true,
  // },
  // endLng: {
  //   type: Number,
  //   required: true,
  // },
  // endLat: {
  //   type: Number,
  //   required: true,
  // },
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
