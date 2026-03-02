const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  name: String,
  ownerName: String,
  phone: String,
  address: String,
  price: Number,
  turnaroundTime: Number,
  permitStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  permitImage: String,
  rejectionReason: String,
  rating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model("Shop", shopSchema);