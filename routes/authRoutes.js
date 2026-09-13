const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const {
    registerUser,
    loginUser,
    logoutUser,
    showProfile,
    updateProfile,
    updatePassword,
} = require("../controllers/authController");

router.get("/register", (req, res) => res.render("auth/register"));
router.get("/login", (req, res) => res.render("auth/login"));

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);

router.get("/profile", requireAuth, showProfile);
router.post("/profile", requireAuth, updateProfile);
router.post("/profile/password", requireAuth, updatePassword);

module.exports = router;