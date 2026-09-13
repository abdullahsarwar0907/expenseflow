const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const { showCategories, createCategory, deleteCategory } = require("../controllers/categoryController");

router.get("/categories", requireAuth, showCategories);
router.post("/categories", requireAuth, createCategory);
router.post("/categories/:id/delete", requireAuth, deleteCategory);

module.exports = router;