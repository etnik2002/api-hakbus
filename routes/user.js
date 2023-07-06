const router = require("express").Router();
const { registerUser, login, getUserProfile, getSingleUser } = require("../controllers/user-controller");

router.post('/register', registerUser);

router.post('/login', login);

router.get('/:id', getUserProfile);

router.get('/unique/:id', getSingleUser);

module.exports = router;