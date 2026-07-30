const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createCrime,
    getAllCrimes,
    getCrimeById,
    deleteCrime,
    getNearbyCrimes,
    getCrimeMapData
} = require("../controllers/crimeController");
const { route } = require("./authRoutes");

router.post("/", authMiddleware, createCrime);
router.get("/", getAllCrimes);
router.get('/map',getCrimeMapData)
router.get('/nearby',authMiddleware,getNearbyCrimes)
router.get("/:id", getCrimeById);
router.delete("/:id", deleteCrime)

module.exports = router;