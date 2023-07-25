const mongoose = require("mongoose");


const LineSchema = mongoose.Schema({
   
    code : {
        type: String,
        required: true
    },
    from: {
        type: String
    },
    to: {
        type: String
    },
    lat: {
        type: Number,
    },
    lng: {
        type: Number,
    },
    endLat: {
        type: Number,
    },
    endLng: {
        type: Number,
    },

  });




module.exports = mongoose.model("Line", LineSchema);