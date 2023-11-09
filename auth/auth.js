const jwt = require("jsonwebtoken");

module.exports = {
    ceoAccessToken: async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization']; 
            if (!authHeader) {
                return res.status(401).json("Authorization header missing");
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json("Token missing");
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
            return res.status(500).json("Internal Server Error");
        }
    },
    
    verifyActiveAgent: async (req,res,next) => {
        try {
            const authHeader = req.headers['authorization']; 
            if (!authHeader) {
                return res.status(401).json("Authorization header missing");
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json("Token missing");
            }

            const agent = jwt.verify(token, process.env.OUR_SECRET);
            console.log({agent})
            if(!agent.data.isActive) {
                return res.status(403).json('Your account is currently deactivated. Please contact HakBus for reactivation.')
            }

            next();
        } catch (error) {
            console.log(error);
            return res.status(500).json("Internal Server Error");
        }
    }

};
