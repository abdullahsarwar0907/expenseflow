const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const { showDashboard } = require("../controllers/dashboardController");
const jwt = require("jsonwebtoken");

router.get("/", (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.render("home");
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        res.redirect("/dashboard");
    } catch (err) {
        res.render("home");
    }
});

router.get("/dashboard", requireAuth, showDashboard);

module.exports = router;