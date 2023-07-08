const router = require("express").Router();
const { registerTicket, editTicket, deleteTicket, getSingleTicket, getAllTicket, getSearchedTickets, getNearestTicket} = require("../controllers/ticket-controller");

router.get('/nearest', getNearestTicket);

router.get('/all', getAllTicket)

router.post('/create/:agencyID', registerTicket);

router.post('/edit/:id', editTicket);

router.post('/delete/:id',deleteTicket)

router.get('/:id', getSingleTicket)

router.get('/', getSearchedTickets)


module.exports = router;