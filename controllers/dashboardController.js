const Transaction = require("../models/transaction");

async function showDashboard(req, res) {
    try {
        const transactions = await Transaction.find({ userId: req.userId }).populate("category");

        let totalIncome = 0;
        let totalExpense = 0;
        const categoryTotals = {};

        transactions.forEach((tx) => {
            if (tx.type === "income") {
                totalIncome += tx.amount;
            } else if (tx.type === "expense") {
                totalExpense += tx.amount;

                const catName = tx.category.name;
                if (!categoryTotals[catName]) {
                    categoryTotals[catName] = 0;
                }
                categoryTotals[catName] += tx.amount;
            }
        });

        const balance = totalIncome - totalExpense;

        res.render("dashboard", {
            totalIncome,
            totalExpense,
            balance,
            categoryLabels: Object.keys(categoryTotals),
            categoryValues: Object.values(categoryTotals),
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while loading the dashboard.");
    }
}

module.exports = { showDashboard };