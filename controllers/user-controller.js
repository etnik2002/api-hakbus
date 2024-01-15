const Booking = require('../models/Booking');
const User = require('../models/User');
const bcrypt = require("bcrypt")

module.exports = {

    registerUser: async (req, res) => {
        try {
          const userExists = await User.find({ email: req.body.email });
          if (userExists.length > 0) {
            return res.status(500).json("Email already exists");
          }
          const hashedPassword = await bcrypt.hashSync(req.body.password, 10);
    
          const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            fcmToken: req.body.fcmToken ? req.body.fcmToken : null,
          })
    
          const savedUser = await newUser.save();
          res.status(200).json(savedUser);
        } catch (error) {
          res.status(500).json(`error -> ${error}`);
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
            const userBookings = await Booking.find({ buyer: req.params.id })
              .populate({
                path: 'ticket',
                populate: { path: 'lineCode', model: 'Line' } 
              })
              .populate({
                path: 'buyer seller',
                select: '-password'
              })
              .sort({ createdAt: 'desc' });
        
            const user = await User.findById(req.params.id);
            res.status(200).json({ user: user, userBookings: userBookings });
          } catch (error) {
            res.status(500).send({ message: "Some error happened" + error });
          }
        },
      getSingleUser: async (req,res) => {
        try {
          const user = await User.findById(req.params.id);
          res.status(200).json(user);
        } catch (error) {
          console.log(error)
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

}