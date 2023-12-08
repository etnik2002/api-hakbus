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
    },  
    city: {
        type: String,
    },
    country: {
        type: String,
    },
    phone: {
        type: String
    },
    percentage: {
        type: Number,
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
    isApplicant: {
        type: Boolean
    },
    vat: {
        type: String,
    },
    address: {
        type: String,
    },
    company_id: {
        type: String,
    },
} , { timestamps : true } )

agencySchema.methods.generateAuthToken = function (data) {
    data.password = undefined;
    const token = jwt.sign({ data }, process.env.OUR_SECRET);
    
    return token;
};

// agencySchema.methods.generateAuthToken = function (data) {
//     data.password = undefined;
//     const token = jwt.sign({ data }, process.env.OUR_SECRET, {
//       expiresIn: '7d',
//     });
    
//     return token;
//   };

module.exports = mongoose.model("Agency", agencySchema);