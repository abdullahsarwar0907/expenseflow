const Category = require("../models/category");

async function showCategories(req, res) {
    try {
        const categories = await Category.find({
            $or: [{ isDefault: true }, { userId: req.userId }],
        });

        res.render("categories/index", { categories });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while loading categories.");
    }
}

async function createCategory(req, res) {
    try {
        const { name, icon } = req.body;

        const newCategory = new Category({
            name,
            icon: icon || "📁",
            isDefault: false,
            userId: req.userId,
        });

        await newCategory.save();

        res.redirect("/categories");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while creating the category.");
    }
}

async function deleteCategory(req, res) {
    try {
        const category = await Category.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId,
            isDefault: false,
        });

        if (!category) {
            return res.status(404).send("Category not found or cannot be deleted.");
        }

        res.redirect("/categories");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while deleting the category.");
    }
}

module.exports = { showCategories, createCategory, deleteCategory };