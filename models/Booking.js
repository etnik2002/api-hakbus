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
            }
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
