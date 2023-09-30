const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;


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



const attachmentUpload = multer({ storage: cloudinaryStorage });

module.exports = { attachmentUpload };
