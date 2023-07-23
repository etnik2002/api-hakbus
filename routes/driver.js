const router = require("express").Router();
const { createDriver, getAllDrivers, getDriverById, deleteDriver, scanBooking } = require("../controllers/driver-controller");


router.post('/create', createDriver);

router.get('/', getAllDrivers);

router.get('/:id', getDriverById);

router.post('/delete/:id', deleteDriver);

router.post('/:bookingID/:driverID', scanBooking);


module.exports = router;

