const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');

// Expects an array of files under the field name 'images'
router.post('/images', upload.array('images', 3), (req, res) => {
    try {
        // req.files contains the uploaded files on Cloudinary
        // We map through them to extract the live secure URLs
        const urls = req.files.map(file => file.path);
        res.status(200).json({ urls });
    } catch (error) {
        res.status(500).json({ message: 'Failed to upload images' });
    }
});

module.exports = router;
