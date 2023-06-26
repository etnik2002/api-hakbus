const { placeBooking, getSingleBooking, getWeeklyBookings, getMonthlyBookings } = require("../controllers/booking-controller");

const router = require("express").Router();

router.get('/monthly', getMonthlyBookings);

router.post('/create/:buyerID/:sellerID/:ticketID', placeBooking);

router.get('/:id', getSingleBooking);




module.exports = router;