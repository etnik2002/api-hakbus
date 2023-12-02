const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const citySchema = mongoose.Schema({
    name: {
        type: String,
    },
    country: {
        type :String ,
    },
    lat: {
        type: Number,
    },
    lng: {
        type: Number,
    },
    code: {
        type: String,
    },
})


module.exports = mongoose.model("City", citySchema);