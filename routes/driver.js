const router = require("express").Router();
const { createDriver, getAllDrivers, getDriverById, deleteDriver, scanBooking, editDriver, login } = require("../controllers/driver-controller");


router.post('/create', createDriver);

router.get('/', getAllDrivers);

router.get('/:id', getDriverById);

router.post('/delete/:id', deleteDriver);

router.post('/scan/:bookingID/:driverID', scanBooking);

router.post('/edit/:id', editDriver);

router.post('/login',login);


module.exports = router;

