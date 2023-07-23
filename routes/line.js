const router = require("express").Router();
const { createLine, getLineBookings, getSingleLineBookings,getAllLines, deleteLine } = require("../controllers/line-controller");

router.post('/create', createLine);

router.get('/', getAllLines);

router.get('/line-bookings', getLineBookings);

router.get('/line-bookings/:id',getSingleLineBookings)

router.post('/delete/:id', deleteLine)

module.exports = router;