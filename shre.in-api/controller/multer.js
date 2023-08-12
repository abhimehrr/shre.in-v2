const multer = require("multer");
const path = require("path")

module.exports = multer({
  storage: multer.diskStorage({
    destination: (req, file, next) => {
      next(null, path.join(__dirname, "../static/uploads"));
    },
    filename: (req, file, next) => {
      next(null, `${Date.now()} - ${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});