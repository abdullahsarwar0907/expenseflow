const Budget = require("../models/budget");
const Category = require("../models/category");
const Transaction = require("../models/transaction");

async function createBudget(req, res) {
    try {
        const { category, month, amount } = req.body;

        const existing = await Budget.findOne({
            userId: req.userId,
            category,
            month,
        });

        if (existing) {
            return res.status(400).send("A budget for this category and month already exists.");
        }

        const newBudget = new Budget({
            userId: req.userId,
            category,
            month,
            amount,
        });

        await newBudget.save();

        res.redirect("/budgets");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while creating the budget.");
    }
}

async function showCreateBudgetForm(req, res) {
    try {
        const categories = await Category.find({
            $or: [{ isDefault: true }, { userId: req.userId }],
        });

        res.render("budgets/new", { categories });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while loading the form.");
    }
}

async function getBudgets(req, res) {
    try {
        const budgets = await Budget.find({ userId: req.userId }).populate("category");

        const budgetsWithSpending = await Promise.all(
            budgets.map(async (budget) => {
                const [year, monthNum] = budget.month.split("-");
                const startDate = new Date(`${year}-${monthNum}-01`);
                const endDate = new Date(year, Number(monthNum), 1);

                const transactions = await Transaction.find({
                    userId: req.userId,
                    category: budget.category._id,
                    type: "expense",
                    date: { $gte: startDate, $lt: endDate },
                });

                const spent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
                const remaining = budget.amount - spent;
                const isExceeded = spent > budget.amount;

                return {
                    budget,
                    spent,
                    remaining,
                    isExceeded,
                };
            })
        );

        res.render("budgets/index", { budgetsWithSpending });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while loading budgets.");
    }
}

async function showEditBudgetForm(req, res) {
    try {
        const budget = await Budget.findOne({ _id: req.params.id, userId: req.userId });
        if (!budget) {
            return res.status(404).send("Budget not found.");
        }

        const categories = await Category.find({
            $or: [{ isDefault: true }, { userId: req.userId }],
        });

        res.render("budgets/edit", { budget, categories });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while loading the budget.");
    }
}

async function updateBudget(req, res) {
    try {
        const { category, month, amount } = req.body;

        const duplicate = await Budget.findOne({
            _id: { $ne: req.params.id },
            userId: req.userId,
            category,
            month,
        });

        if (duplicate) {
            return res.status(400).send("A budget for this category and month already exists.");
        }

        const budget = await Budget.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { category, month, amount, alertSent: false },
            { runValidators: true }
        );

        if (!budget) {
            return res.status(404).send("Budget not found.");
        }

        res.redirect("/budgets");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while updating the budget.");
    }
}

async function deleteBudget(req, res) {
    try {
        const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!budget) {
            return res.status(404).send("Budget not found.");
        }
        res.redirect("/budgets");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while deleting the budget.");
    }
}

module.exports = {
    createBudget,
    showCreateBudgetForm,
    getBudgets,
    showEditBudgetForm,
    updateBudget,
    deleteBudget,
};