const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const {
    addTransaction,
    getTransactions,
    showAddTransactionForm,
    showEditTransactionForm,
    updateTransaction,
    deleteTransaction,
    exportTransactionsCSV,
    exportTransactionsPDF,
} = require("../controllers/transactionController");

router.get("/transactions/new", requireAuth, showAddTransactionForm);
router.get("/transactions/:id/edit", requireAuth, showEditTransactionForm);
router.post("/transactions/:id/edit", requireAuth, updateTransaction);
router.post("/transactions/:id/delete", requireAuth, deleteTransaction);
router.post("/transactions", requireAuth, addTransaction);
router.get("/transactions", requireAuth, getTransactions);
router.get("/transactions/export/csv", requireAuth, exportTransactionsCSV);
router.get("/transactions/export/pdf", requireAuth, exportTransactionsPDF);

module.exports = router;