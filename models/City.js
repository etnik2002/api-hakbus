const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const citySchema = mongoose.Schema({
    name: {
        type: String,
    },
})


module.exports = mongoose.model("City", citySchema);