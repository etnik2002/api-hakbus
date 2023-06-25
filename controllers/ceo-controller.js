const Ceo = require("../models/Ceo")

module.exports = {
    createCeo :  async (req,res) => {
        try {
            const hashedPassword = await bcrypt.hashSync(req.body.password, 10);

            const newCeo = new Ceo({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            })

            await newCeo.save();

            res.status(200).json(`successfully created the new ceo -> ${newCeo}`);

        } catch (error) {
            console.error(error);
            res.status(500).json(error)
        }
    },

    login: async (req, res) => {
        try {
    
          const ceo = await Ceo.findOne({ email: req.body.email });
          if (!ceo) {
            return res.status(401).json({ message: "Invalid Email " });
          }
    
          const validPassword = await bcrypt.compare(
            req.body.password,
            ceo.password
          );
    
          if (!validPassword) {
            return res.status(401).json({ data: null, message: "Invalid  Password" });
          }
    
          const token = ceo.generateAuthToken(ceo);
          res.setHeader('Authorization', `Bearer ${token}`);
    
          res.status(200).json({ data: token, message: "logged in successfully" });
        } catch (error) {
          res.status(500).send({ message: "Some error happened" + error });
        }
      },

}