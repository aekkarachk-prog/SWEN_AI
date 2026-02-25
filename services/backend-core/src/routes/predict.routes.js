const express = require("express");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.post("/predict", upload.single("image"), async (req, res) => {

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.json({
    message: "File validated successfully",
    fileType: req.file.mimetype
  });
});

module.exports = router;