const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    userId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    reviewerName: { type: String },
    isAnonymous: { type: Boolean, default: false },
    images: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);
