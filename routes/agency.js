const router = require("express").Router();
const { verifyActiveAgent, verifyDeletionPin, ceoAccessToken, verifyAgentAccessToken } = require("../auth/auth");
const { createAgency, loginAsAgency, getAll,payDebt,getSearchedTickets, deleteAgency, editAgency, getAgenciesInDebt, confirmBookingPayment, getSingleAgency, getAgencyTickets, soldTickets, scanBooking, createScanningToken, getToken, deleteToken, sendBookingAttachment, getAgencySales, makeBookingForCustomers, applyForCollaboration, 
 } = require("../controllers/agency-controller");
const { attachmentUpload, agentUpload } = require('../helpers/multer/multer');
const { requestLimiter } = require("../auth/limiter");

router.use(requestLimiter);

router.get('/sales/:id', getAgencySales)

router.get('/debt', getAgenciesInDebt);

router.post('/create',ceoAccessToken, createAgency);

router.post('/sales/register',agentUpload.single("document"), applyForCollaboration)

router.post('/scan/:bookingID/:agencyID', scanBooking)

router.post('/booking/create/:sellerID/:ticketID',verifyActiveAgent, makeBookingForCustomers);

router.post('/payment/confirm/:id/:agency_id', confirmBookingPayment);

router.post('/attachment/send', attachmentUpload.array('attachments'), sendBookingAttachment)

router.get('/ticket', getSearchedTickets)

router.post('/create/token/:bookingID/:ticketID', createScanningToken);

router.get('/get-token', getToken);

router.post('/delete-token/:token', deleteToken);

router.post('/paydebt/:id', payDebt);

router.post('/login', loginAsAgency);

router.get('/',ceoAccessToken, getAll);

router.get('/:id', getSingleAgency)

router.post('/delete/:id',verifyDeletionPin, deleteAgency)

router.post('/edit/:id', editAgency)

router.get('/tickets/:id', getAgencyTickets)

router.get('/sold/:id', soldTickets)

module.exports = router;