const Transaction = require("../models/transaction");
const Category = require("../models/category");
const PDFDocument = require("pdfkit");

async function addTransaction(req, res) {
    try {
        const { amount, type, category, paymentMethod, note, date, isRecurring, recurringDay } = req.body;

        const newTransaction = new Transaction({
            userId: req.userId,
            amount,
            type,
            category,
            paymentMethod,
            note,
            date,
            isRecurring: isRecurring === "on",
            recurringDay: isRecurring === "on" ? recurringDay : null,
        });

        await newTransaction.save();

        res.redirect("/dashboard");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while adding the transaction.");
    }
}

async function getTransactions(req, res) {
    try {
        const { category, type, paymentMethod, month, search, page } = req.query;

        const filter = { userId: req.userId };

        if (category) filter.category = category;
        if (type) filter.type = type;
        if (paymentMethod) filter.paymentMethod = paymentMethod;
        if (month) {
            const [year, monthNum] = month.split("-");
            const startDate = new Date(`${year}-${monthNum}-01`);
            const endDate = new Date(year, Number(monthNum), 1);
            filter.date = { $gte: startDate, $lt: endDate };
        }

        let transactions = await Transaction.find(filter)
            .populate("category")
            .sort({ date: -1 });

        if (search) {
            const searchLower = search.toLowerCase();
            transactions = transactions.filter((tx) => {
                const noteMatch = tx.note.toLowerCase().includes(searchLower);
                const categoryMatch = tx.category.name.toLowerCase().includes(searchLower);
                const amountMatch = tx.amount.toString().includes(searchLower);
                return noteMatch || categoryMatch || amountMatch;
            });
        }

        const currentPage = Number(page) || 1;
        const perPage = 10;
        const totalCount = transactions.length;
        const totalPages = Math.ceil(totalCount / perPage);

        const startIndex = (currentPage - 1) * perPage;
        const paginatedTransactions = transactions.slice(startIndex, startIndex + perPage);

        const categories = await Category.find({
            $or: [{ isDefault: true }, { userId: req.userId }],
        });

        res.render("transactions/index", {
            transactions: paginatedTransactions,
            categories,
            query: req.query,
            currentPage,
            totalPages,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while fetching transactions.");
    }
}
async function showAddTransactionForm(req, res) {
    try {
        const categories = await Category.find({
            $or: [{ isDefault: true }, { userId: req.userId }],
        });

        res.render("transactions/new", { categories });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while loading the form.");
    }
}

async function showEditTransactionForm(req, res) {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!transaction) {
            return res.status(404).send("Transaction not found.");
        }

        const categories = await Category.find({
            $or: [{ isDefault: true }, { userId: req.userId }],
        });

        res.render("transactions/edit", { transaction, categories });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while loading the transaction.");
    }
}

async function updateTransaction(req, res) {
    try {
        const { amount, type, category, paymentMethod, note, date } = req.body;

        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { amount, type, category, paymentMethod, note, date },
            { new: true, runValidators: true }
        );

        if (!transaction) {
            return res.status(404).send("Transaction not found.");
        }

        res.redirect("/transactions");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while updating the transaction.");
    }
}

async function deleteTransaction(req, res) {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!transaction) {
            return res.status(404).send("Transaction not found.");
        }

        res.redirect("/transactions");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while deleting the transaction.");
    }
}

async function exportTransactionsCSV(req, res) {
    try {
        const transactions = await Transaction.find({ userId: req.userId })
            .populate("category")
            .sort({ date: -1 });

        let csv = "Date,Category,Type,Amount,Payment Method,Note\n";

        transactions.forEach((tx) => {
            const row = [
                tx.date.toISOString().split("T")[0],
                tx.category.name,
                tx.type,
                tx.amount,
                tx.paymentMethod,
                `"${tx.note.replace(/"/g, '""')}"`,
            ];
            csv += row.join(",") + "\n";
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while exporting transactions.");
    }
}

async function exportTransactionsPDF(req, res) {
    try {
        const transactions = await Transaction.find({ userId: req.userId })
            .populate("category")
            .sort({ date: -1 });

        const doc = new PDFDocument({ margin: 40 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=transactions.pdf");

        doc.pipe(res);

        doc.fontSize(18).text("ExpenseFlow - Transaction Report", { align: "center" });
        doc.moveDown();

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach((tx) => {
            if (tx.type === "income") totalIncome += tx.amount;
            else totalExpense += tx.amount;

            const dateStr = tx.date.toISOString().split("T")[0];
            const line = `${dateStr}  |  ${tx.category.name}  |  ${tx.type}  |  ₹${tx.amount}  |  ${tx.paymentMethod}  |  ${tx.note || "-"}`;

            doc.fontSize(10).text(line);
        });

        doc.moveDown();
        doc.fontSize(12).text(`Total Income: ₹${totalIncome}`);
        doc.text(`Total Expense: ₹${totalExpense}`);
        doc.text(`Balance: ₹${totalIncome - totalExpense}`);

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while generating the PDF.");
    }
}

module.exports = {
    addTransaction,
    getTransactions,
    showAddTransactionForm,
    showEditTransactionForm,
    updateTransaction,
    deleteTransaction,
    exportTransactionsCSV,
    exportTransactionsPDF,
};