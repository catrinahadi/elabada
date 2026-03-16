const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner" },
  ownerName: { type: String, default: "" },
  phone: { type: String, default: "" },
  address: { type: String, required: true },
  price: { type: Number, default: 0 },
  turnaroundTime: { type: Number, default: 24 },
  permitStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  permitImage: { type: String, default: "" },
  rejectionReason: { type: String, default: "" },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  status: { type: String, enum: ["open", "closed"], default: "open" },
  image: { type: String, default: "" },
  latitude: { type: Number, default: 14.167 },
  longitude: { type: Number, default: 121.241 },
  actualTurnaroundTime: { type: Number }, // Average reported by users
  reliabilityScore: { type: Number, default: 1 }, // 1 = 100% reliable
  amenities: { type: [String], default: [] }, // e.g., ["Pickup", "Delivery", "Folding", "Ironing"]
}, { timestamps: true });

module.exports = mongoose.model("Shop", shopSchema);