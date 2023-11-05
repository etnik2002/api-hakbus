const mongoose = require("mongoose");


const LineSchema = mongoose.Schema({
   
    code : {
        type: String,
        required: true
    },
    phone : {
        type: String,
    },
    from: {
        type: String
    },
    to: {
        type: String
    },
  });

module.exports = mongoose.model("Line", LineSchema);