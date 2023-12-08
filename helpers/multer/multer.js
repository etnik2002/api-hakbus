const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path  = require("path")


cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
});


const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
      folder: 'attachments',
      format: async (req, file) => 'png',
      public_id: (req, file) => Date.now() + '-' + file.originalname,
  },
});

// const agentStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//       folder: 'document',
//       format: async (req, file) => 'doc',
//       public_id: (req, file) => Date.now() + '-' + file.originalname,
//   },
// });

const agentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log({ req, file });
    cb(null, 'public', 'agent');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const agentUpload = multer({ storage: agentStorage });

const attachmentUpload = multer({ storage: cloudinaryStorage });

module.exports = { attachmentUpload, agentUpload };
