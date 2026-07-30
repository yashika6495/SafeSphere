const express = require("express");
const router = express.Router();

const {
    createAlert,
    getAlerts,
    resolveAlert
} = require("../controllers/alertController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createAlert);
router.get("/", authMiddleware, getAlerts);
router.put("/:id", authMiddleware, resolveAlert);

module.exports = router;