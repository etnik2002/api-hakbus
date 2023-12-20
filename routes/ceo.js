const router = require("express").Router();
const { ceoAccessToken } = require("../auth/auth");
const { createCeo, login, getStats, deactivateAgency ,activateAgency,editObserver,getObserverById, addCity, getAllCities, deleteCity, getCeoById, confirmDebtPayment, getAllObservers, deleteObs, setNrOfSeatsNotification, sendBookingToEmail, getAllCitiesPagination, changePassword, changeEmail, changePin, importCitiesFromExcel} = require("../controllers/ceo-controller");
const { attachmentUpload, excelUpload } = require('../helpers/multer/multer');
const { requestLimiter } = require("../auth/limiter");
const apicache = require("apicache");
const cache = apicache.middleware;
router.use(requestLimiter);


router.post('/attachment/send', attachmentUpload.array('attachments'), sendBookingToEmail)

router.post('/create',ceoAccessToken, createCeo);

router.post('/login', login);

router.get('/observer',ceoAccessToken, getAllObservers);

router.get('/observer/:id', getObserverById);

router.post('/observer/edit/:id', editObserver);

router.post('/observer/delete/:id', deleteObs);

router.get('/all-cities',cache('1 minutes'), getAllCities);

router.get('/all-cities-pagination', getAllCitiesPagination);

router.get('/stats', getStats);

router.get('/:id', getCeoById);

router.post('/deactivate/:id',deactivateAgency);

router.post('/activate/:id',activateAgency);

router.post ('/add-city',ceoAccessToken, addCity);

// router.post ('/add-city-excel', excelUpload.single("file"), importCitiesFromExcel);

router.post('/confirm-debt/:id/:notificationId', confirmDebtPayment);

router.post('/seat-notificaiton', setNrOfSeatsNotification)

router.post('/change-password/:id', changePassword)

router.post('/change-email/:id', changeEmail)

router.post('/change-pin/:id', changePin)

router.post('/city/delete/:id', deleteCity);


module.exports = router;