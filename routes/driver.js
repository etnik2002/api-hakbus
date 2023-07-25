const router = require("express").Router();
const { createDriver, getAllDrivers, getDriverById, deleteDriver, scanBooking, editDriver } = require("../controllers/driver-controller");


router.post('/create', createDriver);

router.get('/', getAllDrivers);

router.get('/:id', getDriverById);

router.post('/delete/:id', deleteDriver);

router.post('/:bookingID/:driverID', scanBooking);

router.post('/edit/:id', editDriver);


module.exports = router;

