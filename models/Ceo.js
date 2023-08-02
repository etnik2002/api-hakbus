const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const ceoSchema = mongoose.Schema({
    name: {
        type: String,
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
    otp: {
        type: Number
    },
    totalProfit: {
        type: Number,
    },
    notifications: [
        {
            message: {
                type: String,
            },
            title: {
                type: String,
            },
            agency_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Agency',
            },
            value: {    
                type: Number,
            },
            confirmed: {
                type: Boolean,
                default: false,
            },
        },
    ]

}, { timestamps: true })

ceoSchema.methods.generateAuthToken = function (data) {
    data.password = undefined;
    const token = jwt.sign({ data }, process.env.OUR_SECRET, {
        expiresIn: '7d',
    });

    return token;
};


module.exports = mongoose.model("Ceo", ceoSchema);