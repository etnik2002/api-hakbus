const router = require("express").Router();
const { registerUser, login, getUserProfile, getUserBookings, deleteUser, editUser } = require("../controllers/user-controller");
const { requestLimiter } = require("../auth/limiter");
const apicache = require("apicache");
const { verifyUser } = require("../auth/userAuth");
const cache = apicache.middleware;
router.use(requestLimiter);

router.post('/register', registerUser);

router.post('/login', login);

router.get('/:id',cache('1 minutes'), getUserProfile);

router.post('/delete/:id',deleteUser);

router.post('/edit/:id', editUser)

router.get('/bookings/:id',cache('1 minutes'), getUserBookings);

module.exports = router;
