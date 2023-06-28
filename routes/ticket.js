const router = require("express").Router();
const { registerTicket, editTicket, deleteTicket, getSingleTicket, getAllTicket, getSearchedTickets} = require("../controllers/ticket-controller");

router.get('/all', getAllTicket)

router.post('/create/:agencyID', registerTicket);

router.post('/edit/:agencyID', editTicket);

router.post('/delete/:id',deleteTicket)

router.get('/:id', getSingleTicket)

router.get('/', getSearchedTickets)


module.exports = router;