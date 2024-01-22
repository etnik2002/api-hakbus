const axios = require("axios");

module.exports = {

    refund: async (req,res) => {
        try {
            const response = await axios.post(`https://gateway.bankart.si/api/v3/transaction/${req.params.api_key}/refund`, {
                "referenceUuid": "659c772397835c1c1863",
                "currency": "MKD",
                "amount": "6000",
                "merchantTransactionId": "D-d3ebc016-ee48-4784-8d08-e9531926a7c5",
                "callbackUrl": "https://example.com/callback",
                "description": "Refund money"
            });
            console.log(response.data)
            return res.status(200).json(response.data)
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    
}