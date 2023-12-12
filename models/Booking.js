const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema({
    buyer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    } ,
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agency'
    },
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    },
    date: { type: String },
    from: { type: String },
    to: { type: String },
    fromCode: { type: String },
    toCode: { type: String },
    passengers: [
        {
            fullName: {
                type: String,
            },
            email: {
                type: String,
            },
            phone: {
                type: String,
            },
            birthDate: {
                type: String,
            },
            age: {
                type: Number,
            },
            price: {
                type: Number,
            },
            isScanned: {
                type: Boolean,
                default: false,
            },
            luggagePrice: {
                type: Number,
            },
            numberOfLuggages: {
                type: Number,
            }
        }
    ],
    price: {
        type: Number
    },
    platform: {
        type: String,
        enum: ["ios", "android", "web"]
    },
    isPaid: {
        type: Boolean,
        enum: ['true', 'false'],
        default: 'false',
    },
    
} , { timestamps : true });

module.exports = mongoose.model("Booking", bookingSchema);
