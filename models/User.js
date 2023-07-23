const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema({
    name: {
        type: String,
    },
    // role: {
    //     type: String,
    //     enum: ['user', 'admin'],
    //     default: 'user'
    // },
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
    fcmToken: {
        type: String
    }, 
    
}, { timestamps: true })

userSchema.methods.generateAuthToken = function (data) {
    data.password = undefined;
    const token = jwt.sign({ data }, process.env.OUR_SECRET, {
        expiresIn: '7d',
    });

    return token;
};


module.exports = mongoose.model("User", userSchema);