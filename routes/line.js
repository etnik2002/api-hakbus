const router = require("express").Router();
const { verifyDeletionPin } = require("../auth/auth");
const { createLine, getLineBookings, getSingleLineBookings,getAllLines, deleteLine,getLineById, findTodaysLineTickets, editLine } = require("../controllers/line-controller");

router.post('/create', createLine);

router.get('/', getAllLines);

router.get('/today', findTodaysLineTickets)

router.get('/:id', getLineById)

router.get('/line-bookings', getLineBookings);

router.get('/line-bookings/:id/:from/:to', getSingleLineBookings)

router.post('/delete/:id',verifyDeletionPin, deleteLine)

router.post('/edit/:id', editLine)

module.exports = router;