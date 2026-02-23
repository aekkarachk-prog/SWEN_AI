const multer = require("multer");

// เก็บไฟล์ใน memory (ยังไม่เซฟลง disk)
const storage = multer.memoryStorage();

// ตรวจสอบชนิดไฟล์
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .png and .jpg files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // จำกัด 5MB
  }
});

module.exports = upload;