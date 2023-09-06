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
    from: { type: String },
    to: { type: String },
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
                required: true,
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
            isScannedReturn: {
                type: Boolean,
                default: false,    
            },
        }
    ],
    price: {
        type: Number
    },
    type: {
        type: String,
        enum: ["oneway", "return", 'both'],
        default: "oneway" 
    }, 
    isPaid: {
        type: Boolean,
        enum: ['true', 'false'],
        default: 'false',
    },
    
} , { timestamps : true });

module.exports = mongoose.model("Booking", bookingSchema);
