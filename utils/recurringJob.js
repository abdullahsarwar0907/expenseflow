const cron = require("node-cron");
const Transaction = require("../models/transaction");
const Budget = require("../models/budget");
const User = require("../models/user");
const sendEmail = require("./sendEmail");

function startRecurringJob() {
    cron.schedule("* * * * *", async () => {
        console.log("Running recurring transactions check...");

        const today = new Date();
        const currentDay = today.getDate();

        try {
            const dueTemplates = await Transaction.find({
                isRecurring: true,
                recurringDay: currentDay,
            });

            for (const template of dueTemplates) {
                const alreadyExists = await Transaction.findOne({
                    userId: template.userId,
                    category: template.category,
                    amount: template.amount,
                    isRecurring: false,
                    date: {
                        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                    },
                });

                if (!alreadyExists) {
                    await Transaction.create({
                        userId: template.userId,
                        amount: template.amount,
                        type: template.type,
                        category: template.category,
                        paymentMethod: template.paymentMethod,
                        note: `${template.note} (auto-generated)`,
                        date: today,
                        isRecurring: false,
                    });
                    console.log(`Created recurring transaction for user ${template.userId}`);
                }
            }
        } catch (err) {
            console.error("Recurring job failed:", err);
        }
    });

    cron.schedule("* * * * *", async () => {
        console.log("Running budget alert check...");

        try {
            const budgets = await Budget.find({ alertSent: false }).populate("category");

            for (const budget of budgets) {
                const [year, monthNum] = budget.month.split("-");
                const startDate = new Date(`${year}-${monthNum}-01`);
                const endDate = new Date(year, Number(monthNum), 1);

                const transactions = await Transaction.find({
                    userId: budget.userId,
                    category: budget.category._id,
                    type: "expense",
                    date: { $gte: startDate, $lt: endDate },
                });

                const spent = transactions.reduce((sum, tx) => sum + tx.amount, 0);

                if (spent > budget.amount) {
                    const user = await User.findById(budget.userId);

                    await sendEmail(
                        user.email,
                        "Budget Exceeded - ExpenseFlow",
                        `Your ${budget.category.name} budget of ₹${budget.amount} for ${budget.month} has been exceeded. You've spent ₹${spent} so far.`
                    );

                    budget.alertSent = true;
                    await budget.save();
                }
            }
        } catch (err) {
            console.error("Budget alert job failed:", err);
        }
    });
}

module.exports = startRecurringJob;
