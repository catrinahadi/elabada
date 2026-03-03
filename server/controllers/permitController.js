const Permit = require("../models/Permit");
const Shop = require("../models/Shop");

// GET permit for a shop
exports.getPermit = async (req, res) => {
    try {
        const permit = await Permit.findOne({ shopId: req.params.shopId });
        if (!permit) return res.status(404).json({ message: "Permit not found" });
        res.json(permit);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// POST / upsert a permit for a shop
exports.submitPermit = async (req, res) => {
    try {
        const { shopId, imageUrl } = req.body;
        if (!shopId || !imageUrl) {
            return res.status(400).json({ message: "shopId and imageUrl are required." });
        }
        const permit = await Permit.findOneAndUpdate(
            { shopId },
            { shopId, imageUrl, status: "pending", rejectionReason: "" },
            { upsert: true, new: true }
        );
        // Also sync status and image to Shop for admin list
        await Shop.findByIdAndUpdate(shopId, {
            permitStatus: "pending",
            permitImage: imageUrl
        });
        res.status(201).json(permit);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
