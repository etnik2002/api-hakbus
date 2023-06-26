const router = require("express").Router();
const { registerTicket, editTicket, deleteTicket, getSingleTicket } = require("../controllers/ticket-controller");

router.post('/create/:agencyID', registerTicket);

router.post('/edit/:agencyID', editTicket);

router.post('/delete/:id',deleteTicket)

router.get('/:id', getSingleTicket)

module.exports = router;