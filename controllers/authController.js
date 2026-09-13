const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function registerUser(req, res) {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) { return res.status(400).send(" A user with this email already exists"); }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name, email, password: hashedPassword });

        await newUser.save();

        res.redirect("/login");
    } catch (err) {
        console.log(err);
        res.status(500).send("Something went wrong while registering");
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) { return res.status(400).send("Invalid email or password"); }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { return res.status(400).send("Invalid email or password"); }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.redirect("/dashboard");

    } catch (err) {
        console.log(err);
        res.status(500).send("Something went wrong while logging in");
    }
}

function logoutUser(req, res) {
    res.clearCookie("token");
    res.redirect("/");
}

async function showProfile(req, res) {
    try {
        const user = await User.findById(req.userId);
        res.render("auth/profile", { user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while loading your profile.");
    }
}

async function updateProfile(req, res) {
    try {
        const { name, currency } = req.body;

        await User.findByIdAndUpdate(
            req.userId,
            { name, currency },
            { runValidators: true }
        );

        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while updating your profile.");
    }
}

async function updatePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.userId);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).send("Current password is incorrect.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong while updating your password.");
    }
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    showProfile,
    updateProfile,
    updatePassword,
};