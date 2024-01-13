const rateLimit = require("express-rate-limit");

const requestLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 100, 
    message: { success: false, status: 429, message: "Too many requests." },
  });

  
module.exports = { requestLimiter };