const cron = require("node-cron");
const Transaction = require("../models/transaction");
const Budget = require("../models/budget");
const User = require("../models/user");
const sendEmail = require("./sendEmail");

function startRecurringJob() {
    cron.schedule("0 1 * * *", async () => {
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

    cron.schedule("0 2 * * *", async () => {
        console.log("Running budget alert check...");

        try {
            const budgets = await Budget.find({ alertSent: false }).populate("category");
            console.log("Budgets found:", budgets.length);

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
                const remaining = budget.amount - spent;

                console.log(
                    `${budget.category.name} | Budget: ₹${budget.amount} | Spent: ₹${spent} | Remaining: ₹${remaining}`
                );

                if (spent >= budget.amount) {
                    const user = await User.findById(budget.userId);

                    if (!user) {
                        console.log("User not found for budget:", budget._id);
                        continue;
                    }

                    const status = spent > budget.amount ? "exceeded" : "reached";
                    console.log(`Budget ${status}. Sending email...`);

                    const emailText = `Your ${budget.category.name} budget of Rs.${budget.amount} for ${budget.month} has been ${status}. You've spent Rs.${spent} so far.`;

                    const emailHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #1a1a2e;">ExpenseFlow Budget Update</h2>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Your <strong>${budget.category.name}</strong> budget of
      <strong>₹${budget.amount}</strong> for <strong>${budget.month}</strong>
      has been ${status}.
    </p>
    <p style="color: #374151; font-size: 15px;">You've spent <strong>₹${spent}</strong> so far.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 12px;">
      You're receiving this because you set a budget alert in ExpenseFlow.
      Manage your budgets anytime by logging into your account.
    </p>
  </div>
`;

                    const wasSent = await sendEmail(
                        user.email,
                        `Budget ${status === "exceeded" ? "Exceeded" : "Reached"} - ExpenseFlow`,
                        emailText,
                        emailHtml
                    );

                    if (wasSent) {
                        budget.alertSent = true;
                        await budget.save();
                    }
                }
            }
        } catch (err) {
            console.error("Budget alert job failed:", err);
        }
    });
}

module.exports = startRecurringJob;
