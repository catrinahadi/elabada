const Review = require("../models/Review");
const Shop = require("../models/Shop");

// GET all reviews for a shop
exports.getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ shopId: req.params.shopId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// POST a review and update shop's average rating
exports.postReview = async (req, res) => {
    try {
    const { shopId, rating, comment, reviewerName, userId, images, isAnonymous } = req.body;

        if (!shopId || !rating) {
            return res.status(400).json({ message: "shopId and rating are required." });
        }

        const review = await Review.create({
            shopId,
            userId: userId || "anonymous",
            rating,
            comment: comment || "",
            reviewerName: isAnonymous ? "Anonymous" : (reviewerName || "Anonymous"),
            isAnonymous: !!isAnonymous,
            images: images || [],
        });

        // Recalculate shop's average rating
        const allReviews = await Review.find({ shopId });
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await Shop.findByIdAndUpdate(shopId, {
            rating: Math.round(avg * 10) / 10,
            reviewCount: allReviews.length,
        });

        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
