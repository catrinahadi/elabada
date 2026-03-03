const express = require("express");
const router = express.Router();
const {
  getAllShops,
  approveShop,
  rejectShop,
  deleteShop,
  getStats,
} = require("../controllers/adminController");

router.get("/stats", getStats);
router.get("/shops", getAllShops);
router.put("/shops/:id/approve", approveShop);
router.put("/shops/:id/reject", rejectShop);
router.delete("/shops/:id", deleteShop);

module.exports = router;