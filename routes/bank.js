const router = require("express").Router();
const { refund } = require("../controllers/bank-controller");
const { ceoAccessToken } = require("../auth/auth");


router.post('/refund/:api_key', ceoAccessToken, refund);

module.exports = router;