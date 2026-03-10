const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const path = require("path");

// POST /api/upload  — single file, field name "file"
router.post("/", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    // Return a URL the client can use to display the image
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

module.exports = router;
