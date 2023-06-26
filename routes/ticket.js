const router = require("express").Router();
const { registerTicket } = require("../controllers/ticket-controller");

router.post('/create/:agencyID', registerTicket);

module.exports = router;