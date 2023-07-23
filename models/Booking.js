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
    passengers: [
        {
            age: {
                type: Number,
                required: true
            },
            fullName: {
                type: String
            },
            email: {
                type: String
            },
            phone: {
                type: String
            },
        }
    ],
    price: {
        type: Number
    },
    isScanned: {
        type: Boolean,
        default: false
    }
} , { timestamps : true });

module.exports = mongoose.model("Booking", bookingSchema);
