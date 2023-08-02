const router = require("express").Router();
const { createCeo, login, getStats, deactivateAgency ,activateAgency, addCity, getAllCities, deleteCity, getCeoById, confirmDebtPayment} = require("../controllers/ceo-controller");

router.post('/create', createCeo);

router.post('/login', login);

router.get('/stats', getStats);

router.get('/:id', getCeoById);

router.post('/deactivate/:id',deactivateAgency);

router.post('/activate/:id',activateAgency);

router.post ('/add-city', addCity)

router.post('/confirm-debt/:id/:notificationId', confirmDebtPayment)

router.get('/all-cities', getAllCities);

router.post('/city/delete/:id', deleteCity);

module.exports = router;