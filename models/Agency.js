const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const agencySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },  
    city: {
        type: String,
    },
    phone: {
        type: String
    },
    percentage: {
        type: Number,
        required: true
    },
    totalSales: {
        type: Number,
    },
    profit: {
        type: Number,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    debt: {
        type: Number,
    },
    // idc: {
    //     type: String,
    // },
    // scc: {
    //     type: String,
    // }
} , { timestamps : true } )

agencySchema.methods.generateAuthToken = function (data) {
    data.password = undefined;
    const token = jwt.sign({ data }, process.env.OUR_SECRET, {
      expiresIn: '7d',
    });
    
    return token;
  };

module.exports = mongoose.model("Agency", agencySchema);