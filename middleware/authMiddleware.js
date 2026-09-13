const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
    const token = req.cookies.token;
    if (!token) { return res.status(401).send("Please log in to see this page"); }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        req.res.status(401).send("Invalid or expire session. Please log in again");
    }
}

module.exports = requireAuth;