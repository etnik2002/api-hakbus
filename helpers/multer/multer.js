const multer = require('multer');

const attachmendStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/attachments');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const attachmentUpload = multer({ storage: attachmendStorage });

module.exports = { attachmentUpload };
