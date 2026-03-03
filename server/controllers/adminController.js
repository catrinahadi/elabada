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

// GET system stats (counts)
exports.getStats = async (req, res) => {
  try {
    const Shop = require("../models/Shop");
    const Owner = require("../models/Owner");
    const Customer = require("../models/Customer");

    const [pendingShops, approvedShops, rejectedShops, totalOwners, totalCustomers] = await Promise.all([
      Shop.countDocuments({ permitStatus: "pending" }),
      Shop.countDocuments({ permitStatus: "approved" }),
      Shop.countDocuments({ permitStatus: "rejected" }),
      Owner.countDocuments(),
      Customer.countDocuments(),
    ]);

    res.json({
      shops: {
        pending: pendingShops,
        approved: approvedShops,
        rejected: rejectedShops,
        total: pendingShops + approvedShops + rejectedShops
      },
      users: {
        owners: totalOwners,
        customers: totalCustomers,
        total: totalOwners + totalCustomers
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE a shop
exports.deleteShop = async (req, res) => {
  try {
    await Shop.findByIdAndDelete(req.params.id);
    res.json({ message: "Shop deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
