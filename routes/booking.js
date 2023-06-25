const { placeBooking, getSingleBooking } = require("../controllers/booking-controller");

const router = require("express").Router();

router.post('/booking', placeBooking);

router.get('/:id', getSingleBooking);

module.exports = router;