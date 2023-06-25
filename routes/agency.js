const router = require("express").Router();
const { createAgency, loginAsAgency, getAll, deleteAgency } = require("../controllers/agency-controller");

router.post('/create', createAgency);

router.post('/login', loginAsAgency);

router.get('/', getAll)

router.post('/delete/:id', deleteAgency)

module.exports = router;