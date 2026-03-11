const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

// POST /api/upload  — single file, field name "file"
router.post("/", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Cloudinary returns the full URL in req.file.path
    res.json({ url: req.file.path });
});

module.exports = router;
