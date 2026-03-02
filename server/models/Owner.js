const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
}, { timestamps: true });

module.exports = mongoose.model("Owner", ownerSchema);
