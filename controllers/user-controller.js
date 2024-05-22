const { sendOTP } = require('../helpers/mail');
const Booking = require('../models/Booking');
const User = require('../models/User');
const bcrypt = require("bcrypt")
const crypto = require("crypto");

module.exports = {

    registerUser: async (req, res) => {
        try {
          const userExists = await User.find({ email: req.body.email });
          if (userExists.length > 0) {
            return res.status(500).json("Email already exists");
          }
          const hashedPassword = await bcrypt.hashSync(req.body.password, 10);
          const userCount = await User.countDocuments();
    
          const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            fcmToken: req.body.fcmToken ? req.body.fcmToken : null,
            index: userCount + 1,
          })
    
          const savedUser = await newUser.save();
          res.status(200).json(savedUser);
        } catch (error) {
          res.status(500).json(`error -> ${error}`);
        }
      },

      editUser: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
    
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const payload = {
                name: req.body.name || user.name,
                email: req.body.email || user.email,
                password: req.body.password || hashedPassword,
            };
    
    
            const updatedUser = await User.findByIdAndUpdate(user._id, payload);
            if (!updatedUser) {
                return res.status(403).json("User not updated");
            }
    
            return res.status(200).json("Success");
        } catch (error) {
            console.log(error);
            return res.status(500).json(error);
        }
    },
    

    sendOtp: async (req, res) => {
      try {
          const otp = generateSixDigitNumber();
          console.log({ otp });
  
          const user = await User.findOne({ email: req.body.email });
  
          if (!user) {
              return res.status(404).json({ error: "User not found" });
          }
  
          user.otp = otp;
          
          await user.save();
          await sendOTP(user.email, otp )
          console.log(user);
          return res.status(201).json(otp);
        } catch (error) {
            console.log(error);
            return res.status(500).json(error);
        }
    },
  
      checkOtp: async (req,res) => {
        try {
          const user = await User.findOne({ email: req.body.email }).select('otp');
          if(user.otp != req.body.otp){
            return res.status(401).json("Wrong otp");
          }

          return res.status(200).json(true);
        } catch (error) {
          console.log(error);
          return res.status(500).json(error)
        }
      },
      resetPw: async (req, res) => {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
            const user = await User.findOne({ email: req.body.email });
    
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
    
            user.password = hashedPassword;
            await user.save();
    
            return res.status(200).json("Success");
        } catch (error) {
            console.log(error);
            return res.status(500).json(error);
        }
    },
    
    
      login: async (req, res) => {
        try {
    
          const user = await User.findOne({ email: req.body.email });
          if (!user) {
            return res.status(401).json({ message: "Invalid Email " });
          }
    
          const validPassword = await bcrypt.compare(
            req.body.password,
            user.password
          );
    
          if (!validPassword) {
            return res.status(401).json({ data: null, message: "Invalid  Password" });
          }
    
          const token = user.generateAuthToken(user);
          await User.findByIdAndUpdate(user._id, { $set: { fcmToken: req.body.fcmToken } });
          res.setHeader('Authorization', `Bearer ${token}`);
    
          res.status(200).json({ data: token, message: "logged in successfully" });
        } catch (error) {
          res.status(500).send({ message: "Some error happened" + error });
        }
      },
        
        getUserProfile: async (req,res) => {
          try {
            const user = await User.findById(req.params.id);
            res.status(200).json(user);
          } catch (error) {
            res.status(500).send({ message: "Some error happened" + error });
          }
        },


      deleteUser: async (req,res) => {
        try {
          await User.findByIdAndRemove(req.params.id);
          return res.status(200).json("User deleted")
        } catch (error) {
          res.status(500).send({ message: "Some error happened" + error });
        }
      },

      getUserBookings: async (req,res) => {
        try {
          const bookings = await Booking.find({ buyer: req.params.id, isPaid: true }).populate('ticket');
          return res.status(200).json(bookings);
        } catch (error) {
          res.status(500).send({ message: "Some error happened" + error });
        }
      }

}


function generateSixDigitNumber() {
  const min = 100000;
  const max = 999999;
  const randomNumber = crypto.randomInt(min, max + 1);
  return randomNumber;
}