const express = require("express");
const router = express.Router();
const { getPermit, submitPermit } = require("../controllers/permitController");

router.get("/:shopId", getPermit);
router.post("/", submitPermit);

module.exports = router;
