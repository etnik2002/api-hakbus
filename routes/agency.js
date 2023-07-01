const router = require("express").Router();
const { createAgency, loginAsAgency, getAll, deleteAgency, editAgency, getAgenciesInDebt, getSingleAgency, getAgencyTickets, soldTickets, scanBooking, createScanningToken, getToken, deleteToken } = require("../controllers/agency-controller");

router.get('/debt', getAgenciesInDebt);

router.post('/create', createAgency);

router.post('/scan/:bookingID/:agencyID', scanBooking)

router.post('/create/token/:bookingID/:ticketID', createScanningToken);

router.get('/get-token', getToken);

router.post('/delete-token/:token', deleteToken);

router.post('/login', loginAsAgency);

router.get('/', getAll);

router.get('/:id', getSingleAgency)

router.post('/delete/:id', deleteAgency)

router.post('/edit/:id', editAgency)

router.get('/tickets/:id', getAgencyTickets)

router.get('/sold/:id', soldTickets)

module.exports = router;