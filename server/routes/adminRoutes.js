const express = require("express");
const router = express.Router();
const {
  getAllShops,
  approveShop,
  rejectShop,
} = require("../controllers/adminController");

router.get("/shops", getAllShops);
router.put("/shops/:id/approve", approveShop);
router.put("/shops/:id/reject", rejectShop);

module.exports = router;