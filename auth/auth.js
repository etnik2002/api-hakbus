const jwt = require("jsonwebtoken");
const Ceo = require("../models/Ceo");
const mongoose = require("mongoose")

module.exports = {
    ceoAccessToken: async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'] || req.headers.authorization; 
            if (!authHeader) {
                return res.status(401).json("No access here");
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json("No access here");
            }

            const user = jwt.verify(token, process.env.OUR_SECRET);
            try {
                if (user.data.role != 'ceo') {
                    return res.status(401).json("You don't have access here!");
                }
                next();
            } catch (error) {
                return res.status(401).json(`Error ncentrall`);
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json("Try again");
        }
    },
    
    verifyActiveAgent: async (req,res,next) => {
        try {
            const authHeader = req.headers['authorization']; 
            if (!authHeader) {
                return res.status(401).json("No access here");
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json("No access here");
            }

            const agent = jwt.verify(token, process.env.OUR_SECRET);
            if(!agent.data.isActive) {
                return res.status(403).json('Your account is currently deactivated. Please contact HakBus for reactivation.')
            }

            next();
        } catch (error) {
            console.log(error);
            return res.status(500).json("try again");
        }
    },

    verifyDeletionPin: async (req,res, next) => {
        try {
            const id = new mongoose.Types.ObjectId(req.body.userID)
            const ceo = await Ceo.find();
            console.log(ceo)
            if(ceo[0].deletionPin != req.body.pin && ceo[0]._id != req.body.userID) {
                return res.status(401).json("Wrong pin");
            }
            next();

        } catch (error) {
            console.log(error);
            return res.status(500).json("Internal Server Error");
        }
    },

    verifyAgentAccessToken: async (req,res,next) => {
        try {
            const authHeader = req.headers['authorization']; 
            if (!authHeader) {
                return res.status(401).json("No access here");
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json("No access here");
            }

            const agent = jwt.verify(token, process.env.OUR_SECRET);
            try {
                if (!agent) {
                    return res.status(401).json("You don't have access here!");
                }
                next();
            } catch (error) {
                return res.status(401).json(`Error ncentrall`);
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json("Internal Server Error");
        }
    }

};
