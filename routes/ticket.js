const router = require("express").Router();
const { registerTicket, editTicket, deleteTicket, getSingleTicket, getAllTicket, getSearchedTickets, getNearestTicket, getAllTicketPagination} = require("../controllers/ticket-controller");

router.post('/create', registerTicket);

router.get('/nearest', getNearestTicket);

router.get('/all', getAllTicketPagination);

router.get('/all-tickets', getAllTicket);

router.post('/edit/:id', editTicket);

router.post('/delete/:id',deleteTicket);

router.get('/:id', getSingleTicket);

router.get('/', getSearchedTickets);


module.exports = router;