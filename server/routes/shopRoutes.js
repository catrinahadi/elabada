const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Shop route working" });
});

module.exports = router;