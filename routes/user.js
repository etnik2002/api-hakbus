const router = require("express").Router();
const { registerUser, login, getUserProfile } = require("../controllers/user-controller");

router.post('/register', registerUser);

router.post('/login', login);

router.get('/:id',getUserProfile);

module.exports = router;