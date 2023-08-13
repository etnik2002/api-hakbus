const router = require("express").Router();
const { createAgency, loginAsAgency, getAll,payDebt, deleteAgency, editAgency, getAgenciesInDebt, confirmBookingPayment, getSingleAgency, getAgencyTickets, soldTickets, scanBooking, createScanningToken, getToken, deleteToken, sendBookingAttachment, getAgencySales } = require("../controllers/agency-controller");
const { attachmentUpload } = require('../helpers/multer/multer');

router.get('/sales/:id', getAgencySales)

router.get('/debt', getAgenciesInDebt);

router.post('/create', createAgency);

router.post('/scan/:bookingID/:agencyID', scanBooking)

router.post('/payment/confirm/:id', confirmBookingPayment);

router.post('/attachment/send', attachmentUpload.array('attachments'), sendBookingAttachment)


router.post('/create/token/:bookingID/:ticketID', createScanningToken);

router.get('/get-token', getToken);

router.post('/delete-token/:token', deleteToken);

router.post('/paydebt/:id', payDebt);

router.post('/login', loginAsAgency);

router.get('/', getAll);

router.get('/:id', getSingleAgency)

router.post('/delete/:id', deleteAgency)

router.post('/edit/:id', editAgency)

router.get('/tickets/:id', getAgencyTickets)

router.get('/sold/:id', soldTickets)

module.exports = router;