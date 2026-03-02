const Shop = require("../models/Shop");

// GET all shops
exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find();
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Approve shop
exports.approveShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    shop.permitStatus = "approved";
    shop.rejectionReason = "";
    await shop.save();
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Reject shop
exports.rejectShop = async (req, res) => {
  try {
    const { reason } = req.body;
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    shop.permitStatus = "rejected";
    shop.rejectionReason = reason;
    await shop.save();
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
