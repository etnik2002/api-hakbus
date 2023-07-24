const router = require("express").Router();
const { registerTicket, editTicket, deleteTicket, updateSeats, stopSales, getSingleTicket, getAllTicket, getSearchedTickets, getNearestTicket, getAllTicketPagination, getTicketLinesBasedOnDate, allowSales} = require("../controllers/ticket-controller");

router.post('/create', registerTicket);

router.post('/stop-sales/:id', stopSales);

router.post('/allow-sales/:id', allowSales);

router.post('/update-seats/:id', updateSeats);

router.get('/nearest', getNearestTicket);

router.get('/all', getAllTicketPagination);

router.get('/lines', getTicketLinesBasedOnDate);

router.get('/all-tickets', getAllTicket);

router.post('/edit/:id', editTicket);

router.post('/delete/:id',deleteTicket);

router.get('/:id', getSingleTicket);

router.get('/', getSearchedTickets);

module.exports = router;