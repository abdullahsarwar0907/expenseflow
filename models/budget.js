const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
        month: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        alertSent: { type: Boolean, default: false },
    },
    { timestamps: true }
);

budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);