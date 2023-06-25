const router = require("express").Router();
const { createCeo, login } = require("../controllers/ceo-controller");

router.post('/create', createCeo);

router.post('/login', login);

module.exports = router;