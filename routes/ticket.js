const router = require("express").Router();
const { registerTicket, editTicket, deleteTicket, updateSeats,updateReturnSeats, stopSales, getSingleTicket, getAllTicket, getSearchedTickets, getNearestTicket, getAllTicketPagination, getTicketLinesBasedOnDate, allowSales, getTicketById, getAll} = require("../controllers/ticket-controller");
const { ceoAccessToken, verifyDeletionPin } = require("../auth/auth");

router.get('/lines', getTicketLinesBasedOnDate);

router.post('/create', registerTicket);

router.get('/', getSearchedTickets);

router.get('/getall', getAll);

router.get('/:id', getSingleTicket);

router.post('/stop-sales/:id',verifyDeletionPin, stopSales);

router.post('/allow-sales/:id',verifyDeletionPin, allowSales);

router.post('/update-seats/:id', updateSeats);

router.post('/update-return-seats/:id', updateReturnSeats);

router.get('/nearest', getNearestTicket);

router.get('/all', getAllTicketPagination);

router.get('/all-tickets', getAllTicket);

router.post('/edit/:id', editTicket);

router.post('/delete/:id',verifyDeletionPin, deleteTicket);

module.exports = router;

