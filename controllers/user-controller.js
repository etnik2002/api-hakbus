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
            password: hashedPassword
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

}