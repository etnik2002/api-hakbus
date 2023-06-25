const router = require("express").Router();
const { createAgency, loginAsAgency } = require("../controllers/agency-controller");

router.post('/create', createAgency);

router.post('/login', loginAsAgency);

module.exports = router;