const Review = require("../models/Review");
const Shop = require("../models/Shop");

const updateShopMetrics = async (shopId) => {
    const allReviews = await Review.find({ shopId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    const reviewsWithTime = allReviews.filter(r => r.actualTimeTaken != null);
    const avgActualTime = reviewsWithTime.length > 0 
        ? reviewsWithTime.reduce((sum, r) => sum + r.actualTimeTaken, 0) / reviewsWithTime.length
        : null;

    const onTimeCount = allReviews.filter(r => r.wasOnTime !== false).length;
    const reliability = onTimeCount / allReviews.length;

    return await Shop.findByIdAndUpdate(shopId, {
        rating: Math.round(avg * 10) / 10,
        reviewCount: allReviews.length,
        actualTurnaroundTime: avgActualTime ? Math.round(avgActualTime * 10) / 10 : null,
        reliabilityScore: Math.round(reliability * 100) / 100
    });
};

// GET all reviews for a shop
exports.getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ shopId: req.params.shopId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// POST a review
exports.postReview = async (req, res) => {
    try {
        const { shopId, rating, comment, reviewerName, userId, images, isAnonymous, wasOnTime, actualTimeTaken } = req.body;

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
            wasOnTime: wasOnTime !== undefined ? wasOnTime : true,
            actualTimeTaken: actualTimeTaken || null,
        });

        await updateShopMetrics(shopId);
        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// PATCH to verify turnaround (Option used in Post-Review Popup)
exports.verifyReview = async (req, res) => {
    try {
        const { wasOnTime, actualTimeTaken } = req.body;
        const reviewId = req.params.id;

        const review = await Review.findByIdAndUpdate(reviewId, {
            wasOnTime,
            actualTimeTaken: wasOnTime ? null : actualTimeTaken
        }, { new: true });

        if (!review) return res.status(404).json({ message: "Review not found" });

        await updateShopMetrics(review.shopId);
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
