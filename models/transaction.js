const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        type: {
            type: String,
            enum: ["income", "expense"],
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "upi", "card", "netbanking", "other"],
            default: "other",
        },
        note: {
            type: String,
            trim: true,
            default: "",
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        isRecurring: {
            type: Boolean,
            default: false,
        },
        recurringDay: {
            type: Number,
            min: 1,
            max: 28,
            default: null,
        },
    },
    { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);