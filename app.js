require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const startRecurringJob = require("./utils/recurringJob");

connectDB();
startRecurringJob();

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", transactionRoutes);
app.use("/", budgetRoutes);
app.use("/", categoryRoutes);

app.use((req, res) => {
    res.status(404).render("errors/404");
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render("errors/500");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
