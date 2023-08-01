const router = require('express').Router();
const { sendNotificationsForTwoSeatsLeft } = require('../controllers/notification-controller');

router.post('/', sendNotificationsForTwoSeatsLeft)

module.exports = router;