const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { normalizePhone, validatePhone } = require("../utils/phone");

const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // The client validates too, but that's a convenience — anything
        // can POST here directly, so the rules have to live server-side.
        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Name is required" });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim())) {
            return res.status(400).json({ message: "Enter a valid email address" });
        }

        if (!password || String(password).length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const phoneError = validatePhone(phone);
        if (phoneError) {
            return res.status(400).json({ message: phoneError });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({
                message: "The user already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name: String(name).trim(),
            email: normalizedEmail,
            phone: normalizePhone(phone),
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = register;