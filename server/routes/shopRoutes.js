const express = require("express");
const router = express.Router();
const {
    getApprovedShops,
    getShop,
    getOwnerShops,
    createShop,
    updateShop,
    deleteShop,
} = require("../controllers/shopController");

router.get("/", getApprovedShops);   // public: only approved
router.get("/owner/:ownerId", getOwnerShops);      // owner's own shops (all statuses)
router.get("/:id", getShop);
router.post("/", createShop);
router.put("/:id", updateShop);
router.delete("/:id", deleteShop);

module.exports = router;