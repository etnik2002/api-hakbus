const Agency = require("../models/Agency");
const Ticket = require("../models/Ticket");
const Booking = require("../models/Booking");
const bcrypt = require("bcrypt");

module.exports = {

    createAgency :  async (req,res) => {
        try {
            const hashedPassword = await bcrypt.hashSync(req.body.password, 10);

            const newAgency = new Agency({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                phone: req.body.phone,
                percentage: req.body.percentage
            })

            await newAgency.save();

            res.status(200).json(`successfully created the new agency -> ${newAgency}`);

        } catch (error) {
            console.error(error);
            res.status(500).json(error)
        }
    },

    loginAsAgency: async (req, res) => {
        try {

            const agency = await Agency.findOne({ email: req.body.email });
            if (!agency) {
                return res.status(401).json({ message: "Invalid Email " });
            }
                
            const validPassword = await bcrypt.compare(
                req.body.password,
                agency.password
            );

            if (!validPassword) {
                return res.status(401).json({data: null, message: "Invalid  Password" });
            }

                const token = agency.generateAuthToken(agency);
                res.set('Authorization', `Bearer ${token}`);

                res.status(200).json({ data: token, message: "logged in successfully" });
        } catch (error) {
            res.status(500).send({  message: "Some error happened" + error });
        }
    },

}