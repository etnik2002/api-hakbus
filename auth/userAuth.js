const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose")


module.exports = {

    verifyUser: async (req, res, next) => {
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
                console.log(user.data._id , req.params.id)
                if (user.data._id != req.params.id) {
                    return res.status(401).json("You don't have access here!");
                }
                next();
            } catch (error) {
                return res.status(401).json(`Error ncentrall`);
            }
        } catch (error) {
            return res.status(500).json("error => " + error);
        }
    },

}