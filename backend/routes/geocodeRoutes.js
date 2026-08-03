const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { search, reverse } = require("../controllers/geocodeController");

// Behind auth: this proxies a rate-limited third-party service, so it
// shouldn't be an open relay for anyone on the internet.
router.get("/search", authMiddleware, search);
router.get("/reverse", authMiddleware, reverse);

module.exports = router;
