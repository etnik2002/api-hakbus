const router = require("express").Router();
const { createAgency, loginAsAgency, getAll } = require("../controllers/agency-controller");

router.post('/create', createAgency);

router.post('/login', loginAsAgency);

router.get('/', getAll)

module.exports = router;