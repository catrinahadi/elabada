const express = require("express");
const router = express.Router();
const { getReviews, postReview } = require("../controllers/reviewController");

router.get("/:shopId", getReviews);
router.post("/", postReview);

module.exports = router;
