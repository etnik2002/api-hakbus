const mongoose = require("mongoose");


const LineSchema = mongoose.Schema({
   
    code : {
        type: String,
        required: true
    },
    from: {
        type: String
    },
    to: {
        type: String
    },

  });




module.exports = mongoose.model("Line", LineSchema);