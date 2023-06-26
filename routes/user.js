const router = require("express").Router();
const { registerUser } = require("../controllers/user-controller");

router.post('/register', registerUser);

module.exports = router;