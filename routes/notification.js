const router = require('express').Router();
const { sendNotificationsForTwoSeatsLeft } = require('../controllers/notification-controller');
const { requestLimiter } = require("../auth/limiter");

router.use(requestLimiter);


router.post('/', sendNotificationsForTwoSeatsLeft)

module.exports = router;