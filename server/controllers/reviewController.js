const Review = require("../models/Review");
const Shop = require("../models/Shop");

const updateShopMetrics = async (shopId) => {
    const shop = await Shop.findById(shopId);
    if (!shop) return;

    const allReviews = await Review.find({ shopId });
    const reviewCount = allReviews.length;

    if (reviewCount === 0) {
        return await Shop.findByIdAndUpdate(shopId, {
            rating: 0,
            reviewCount: 0,
            actualTurnaroundTime: null,
            reliabilityScore: 1
        });
    }

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
    
    // Formula Requirements:
    // 1. Min Threshold: 5 reviews
    // 2. Weighted Average: ((PromisedTime * 10) + Sum(ActualTimes)) / (10 + ReviewCount)
    // 3. Cap Outliers: max 2x PromisedTime
    
    let avgActualTime;
    if (reviewCount < 5) {
        // Fallback to promised time if below threshold
        avgActualTime = shop.turnaroundTime;
    } else {
        const BASE_WEIGHT = 10;
        const CAP_MULTIPLIER = 2;
        const maxAllowedTime = shop.turnaroundTime * CAP_MULTIPLIER;

        const totalActualTimeSum = allReviews.reduce((sum, r) => {
            let reviewTime;
            if (r.wasOnTime !== false) {
                reviewTime = shop.turnaroundTime;
            } else {
                // Cap extreme outliers
                reviewTime = Math.min(r.actualTimeTaken || shop.turnaroundTime, maxAllowedTime);
            }
            return sum + reviewTime;
        }, 0);

        avgActualTime = ((shop.turnaroundTime * BASE_WEIGHT) + totalActualTimeSum) / (BASE_WEIGHT + reviewCount);
    }

    const onTimeCount = allReviews.filter(r => r.wasOnTime !== false).length;
    const reliability = onTimeCount / reviewCount;

    return await Shop.findByIdAndUpdate(shopId, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: reviewCount,
        actualTurnaroundTime: Math.round(avgActualTime * 10) / 10,
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
