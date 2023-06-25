const router = require("express").Router();
const { createCeo, login, getStats, deactivateAgency ,activateAgency, addCity, getAllCities, deleteCity} = require("../controllers/ceo-controller");

router.post('/create', createCeo);

router.post('/login', login);

router.get('/stats', getStats);

router.post('/deactivate/:id',deactivateAgency);

router.post('/activate/:id',activateAgency);

router.post ('/add-city', addCity)

router.get('/all-cities', getAllCities);

router.post('/city/delete/:id', deleteCity);

module.exports = router;