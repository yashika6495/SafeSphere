const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const header = req.header("Authorization") || "";

        // Accept both "Bearer <token>" and a bare token. The frontend grew
        // two axios clients that each sent a different one, so half the API
        // answered 401 depending on which module made the call.
        const token = header.startsWith("Bearer ")
            ? header.slice(7).trim()
            : header.trim();

        if (!token) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;
        next();

    } catch (error) {
        console.log("JWT Error:", error.message);

        res.status(401).json({
            message: error.message
        });
    }
};

module.exports = authMiddleware;