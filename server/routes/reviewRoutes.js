const express = require("express");
const router = express.Router();
const { getReviews, postReview, verifyReview } = require("../controllers/reviewController");

router.get("/:shopId", getReviews);
router.post("/", postReview);
router.patch("/:id/verify", verifyReview);

module.exports = router;
