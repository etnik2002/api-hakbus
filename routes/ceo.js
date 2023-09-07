const router = require("express").Router();
const { ceoAccessToken } = require("../auth/auth");
const { createCeo, login, getStats, deactivateAgency ,activateAgency, addCity, getAllCities, deleteCity, getCeoById, confirmDebtPayment, getAllObservers, deleteObs, setNrOfSeatsNotification} = require("../controllers/ceo-controller");


router.post('/create', createCeo);

router.post('/login', login);

router.get('/observer', getAllObservers);

router.post('/observer/delete/:id', deleteObs);

router.get('/all-cities', getAllCities);

router.get('/stats', getStats);

router.get('/:id', getCeoById);

router.post('/deactivate/:id',deactivateAgency);

router.post('/activate/:id',activateAgency);

router.post ('/add-city', addCity);

router.post('/confirm-debt/:id/:notificationId', confirmDebtPayment);

router.post('/seat-notificaiton', setNrOfSeatsNotification)

router.post('/city/delete/:id', deleteCity);

module.exports = router;