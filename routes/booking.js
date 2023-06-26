const { placeBooking, getSingleBooking, getWeeklyBookings } = require("../controllers/booking-controller");

const router = require("express").Router();

router.post('/create/:buyerID/:sellerID/:ticketID', placeBooking);

router.get('/:id', getSingleBooking);

router.get('/weekly', getWeeklyBookings);

module.exports = router;