const router = require("express").Router();
const { createLine, getLineBookings, getSingleLineBookings,getAllLines, deleteLine, findTodaysLineTickets, editLine } = require("../controllers/line-controller");

router.post('/create', createLine);

router.get('/', getAllLines);

router.get('/today', findTodaysLineTickets)

router.get('/line-bookings', getLineBookings);

router.get('/line-bookings/:id/:from/:to', getSingleLineBookings)

router.post('/delete/:id', deleteLine)

router.post('/edit/:id', editLine)

module.exports = router;