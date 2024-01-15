const router = require("express").Router();
const { registerTicket, editTicket, deleteTicket, updateSeats,updateReturnSeats, stopSales, getSingleTicket, getAllTicket, getSearchedTickets, getNearestTicket, getAllTicketPagination, getTicketLinesBasedOnDate, allowSales, getTicketById, getAll} = require("../controllers/ticket-controller");
const { ceoAccessToken, verifyDeletionPin } = require("../auth/auth");
const { requestLimiter } = require("../auth/limiter");
const apicache = require("apicache");
const cache = apicache.middleware;

router.use(requestLimiter);

router.get('/lines', getTicketLinesBasedOnDate);

router.post('/create',ceoAccessToken, registerTicket);

router.get('/',cache('1 minutes'), getSearchedTickets);

router.get('/:id', getSingleTicket);

router.post('/stop-sales/:id',verifyDeletionPin, stopSales);

router.post('/allow-sales/:id',verifyDeletionPin, allowSales);

router.post('/update-seats/:id', updateSeats);

router.post('/update-return-seats/:id', updateReturnSeats);

router.get('/nearest', getNearestTicket);

router.get('/all',ceoAccessToken, getAllTicketPagination);

router.get('/all-tickets',ceoAccessToken, getAllTicket);

router.post('/edit/:id',ceoAccessToken, editTicket);

router.post('/delete/:id',verifyDeletionPin, deleteTicket);

module.exports = router;

