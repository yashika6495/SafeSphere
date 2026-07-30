const express = require("express");
const router = express.Router();

const register = require("../controllers/registerController");
const login = require("../controllers/loginController");
const profile = require("../controllers/profileController");


const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, profile);

module.exports = router;