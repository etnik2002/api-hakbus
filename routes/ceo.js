const router = require("express").Router();
const { ceoAccessToken } = require("../auth/auth");
const { createCeo, login, getStats, deactivateAgency ,activateAgency,editObserver,getObserverById, addCity, getAllCities, deleteCity, getCeoById, confirmDebtPayment, getAllObservers, deleteObs, setNrOfSeatsNotification, sendBookingToEmail, getAllCitiesPagination} = require("../controllers/ceo-controller");
const { attachmentUpload } = require('../helpers/multer/multer');

router.post('/create', createCeo);

router.post('/attachment/send', attachmentUpload.array('attachments'), sendBookingToEmail)

router.post('/login', login);

router.get('/observer', getAllObservers);

router.get('/observer/:id', getObserverById);

router.post('/observer/edit/:id', editObserver);

router.post('/observer/delete/:id', deleteObs);

router.get('/all-cities', getAllCities);

router.get('/all-cities-pagination', getAllCitiesPagination);

router.get('/stats', getStats);

router.get('/:id', getCeoById);

router.post('/deactivate/:id',deactivateAgency);

router.post('/activate/:id',activateAgency);

router.post ('/add-city', addCity);

router.post('/confirm-debt/:id/:notificationId', confirmDebtPayment);

router.post('/seat-notificaiton', setNrOfSeatsNotification)

router.post('/city/delete/:id', deleteCity);


module.exports = router;