const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");


const driverSchema = mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    code: {
      type: String
    },
    lines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Line',
      },
    ],
    scannedBookings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
          },
    ]
  });

  driverSchema.methods.generateAuthToken = function (data) {
      data.password = undefined;
      const token = jwt.sign({ data }, process.env.OUR_SECRET, {
          expiresIn: '7d',
      });

      return token;
  };


module.exports = mongoose.model("Driver", driverSchema);