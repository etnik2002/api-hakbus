const { placeBooking, getSingleBooking, getWeeklyBookings, getAllBookings, getMonthlyBookings, getFilteredBookings, getBookingsFromDateRange } = require("../controllers/booking-controller");

const router = require("express").Router();

router.get('/', getAllBookings);

router.get('/monthly', getMonthlyBookings);

router.get('/filtered', getFilteredBookings);

router.get('/date-range', getBookingsFromDateRange)

router.post('/create/:buyerID/:sellerID/:ticketID', placeBooking);

router.get('/:id', getSingleBooking);

module.exports = router;