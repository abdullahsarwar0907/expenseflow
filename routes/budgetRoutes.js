const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const {
    createBudget,
    showCreateBudgetForm,
    getBudgets,
    showEditBudgetForm,
    updateBudget,
    deleteBudget,
} = require("../controllers/budgetController");

router.get("/budgets/new", requireAuth, showCreateBudgetForm);
router.get("/budgets", requireAuth, getBudgets);
router.get("/budgets/:id/edit", requireAuth, showEditBudgetForm);
router.post("/budgets/:id/edit", requireAuth, updateBudget);
router.post("/budgets/:id/delete", requireAuth, deleteBudget);
router.post("/budgets", requireAuth, createBudget);

module.exports = router;