const router = require("express").Router();
const { registerUser, login, getUserProfile, getSingleUser, deleteUser } = require("../controllers/user-controller");
const { requestLimiter } = require("../auth/limiter");
const apicache = require("apicache");
const cache = apicache.middleware;
router.use(requestLimiter);

router.post('/register', registerUser);

router.post('/login', login);

router.get('/:id',cache('1 minutes'), getUserProfile);

router.post('/delete/:id', deleteUser);

router.get('/unique/:id', getSingleUser);

module.exports = router;