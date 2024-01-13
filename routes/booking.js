const { placeBooking, getSingleBooking, getWeeklyBookings, getAllBookings, getMonthlyBookings, getFilteredBookings, getBookingsFromDateRange, payBooking, cancelNotPaidImmediatelyBooking } = require("../controllers/booking-controller");
const router = require("express").Router()
const { requestLimiter } = require("../auth/limiter");
const apicache = require("apicache");
const cache = apicache.middleware;
router.use(requestLimiter);


router.post('/create/:buyerID/:ticketID', placeBooking);

router.get('/', getAllBookings);

router.post('/pay/:id/:tid', payBooking)

router.post('/cancel-immediately/:id', cancelNotPaidImmediatelyBooking)

router.get('/monthly', getMonthlyBookings);

router.get('/filtered', getFilteredBookings);

router.get('/date-range', getBookingsFromDateRange)

router.post('/create/:buyerID/:sellerID/:ticketID', placeBooking);

router.get('/:id',cache('10 minutes'), getSingleBooking);

module.exports = router;