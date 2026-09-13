require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/category");

const defaultCategories = [
    { name: "Food", icon: "🍔", isDefault: true },
    { name: "Travel", icon: "✈️", isDefault: true },
    { name: "Shopping", icon: "🛍️", isDefault: true },
    { name: "Bills", icon: "🧾", isDefault: true },
    { name: "Entertainment", icon: "🎬", isDefault: true },
    { name: "Rent", icon: "🏠", isDefault: true },
    { name: "Salary", icon: "💰", isDefault: true },
    { name: "Investment", icon: "📈", isDefault: true },
    { name: "Medical", icon: "🏥", isDefault: true },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        for (const cat of defaultCategories) {
            const exists = await Category.findOne({ name: cat.name, isDefault: true });
            if (!exists) {
                await Category.create(cat);
                console.log(`Created category: ${cat.name}`);
            } else {
                console.log(`Skipped (already exists): ${cat.name}`);
            }
        }

        console.log("Seeding complete.");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();