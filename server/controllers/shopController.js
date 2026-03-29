const Shop = require("../models/Shop");

// GET all approved shops (customer view)
exports.getApprovedShops = async (req, res) => {
    try {
        const shops = await Shop.find({ permitStatus: "approved" });
        res.json(shops);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET single shop
exports.getShop = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ message: "Shop not found" });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET all shops owned by a specific owner
exports.getOwnerShops = async (req, res) => {
    try {
        const shops = await Shop.find({ ownerId: req.params.ownerId });
        res.json(shops);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// POST create a new shop (owner)
exports.createShop = async (req, res) => {
    try {
        const { name, address, price, turnaroundTime, phone, operatingHours, latitude, longitude, ownerId, ownerName, permitImage, image, amenities } = req.body;
        if (!name || !address) {
            return res.status(400).json({ message: "Name and address are required." });
        }
        const shop = await Shop.create({
            name, address, price: Number(price), turnaroundTime: Number(turnaroundTime), phone,
            operatingHours: operatingHours || "8:00 AM - 8:00 PM",
            latitude: Number(latitude), longitude: Number(longitude),
            ownerId, ownerName,
            permitStatus: "pending",
            status: "open",
            permitImage,
            image,
            amenities: amenities || []
        });
        res.status(201).json(shop);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// PUT update shop (owner/admin)
exports.updateShop = async (req, res) => {
    try {
        const { name, address, price, turnaroundTime, phone, operatingHours, latitude, longitude, status, image, amenities } = req.body;
        const updated = await Shop.findByIdAndUpdate(req.params.id, {
            name, address, phone,
            operatingHours,
            price: Number(price),
            turnaroundTime: Number(turnaroundTime),
            latitude: Number(latitude),
            longitude: Number(longitude),
            status,
            image,
            amenities
        }, { new: true });

        if (!updated) return res.status(404).json({ message: "Shop not found" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// DELETE a shop
exports.deleteShop = async (req, res) => {
    try {
        await Shop.findByIdAndDelete(req.params.id);
        res.json({ message: "Shop deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
