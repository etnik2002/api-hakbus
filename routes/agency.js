const router = require("express").Router();
const { createAgency, loginAsAgency, getAll, deleteAgency, editAgency, getSingleAgency, getAgencyTickets, soldTickets } = require("../controllers/agency-controller");

router.post('/create', createAgency);

router.post('/login', loginAsAgency);

router.get('/', getAll)

router.get('/:id', getSingleAgency)

router.post('/delete/:id', deleteAgency)

router.post('/edit/:id', editAgency)

router.get('/tickets/:id', getAgencyTickets)

router.get('/sold/:id', soldTickets)

module.exports = router;