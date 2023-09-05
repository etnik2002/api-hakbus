const Line = require('../models/Line');

const Ceo = require('../models/Ceo');
var admin = require("firebase-admin");
var serviceAccount = require("../helpers/firebase/firebase-config.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });


module.exports = {
    sendNotificationsForTwoSeatsLeft: async (req, res) => {
      try {
        const line = await Line.findById(req.params.id);
        const ceo = await Ceo.find({});
        const fcmToken = ceo[0].fcmToken;

        const notificationPayload = {
          notification: {
            body: 'Only two seats left',
            title: `Hey CEO, only two seats left for ${line.code}`,
          },
        };
  
        await admin
          .messaging()
          .sendToDevice(fcmToken, notificationPayload)
          .then((response) => {
            console.log('Notification sent successfully to device:', response);
            res.status(200).json(response)
        })
          .catch((error) => {
            console.log(`error while sending ntfc -> ${error}`);
            res.status(500).json(error)
        });
      } catch (error) {
        res.status(200).json(error);
      }
    },
  };
  