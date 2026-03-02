const mongoose = require("mongoose");

const permitSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    imageUrl: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    rejectionReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Permit", permitSchema);
