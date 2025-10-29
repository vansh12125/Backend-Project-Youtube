import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, fn) {
    fn(null, "./public/temp");
  },
  filename: function (req, file, fn) {
    fn(null, file.originalname);
  },
});

export const upload = multer({
  storage,
});
