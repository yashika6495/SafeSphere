const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createCrime,
    getAllCrimes,
    getMyCrimes,
    getCrimeById,
    deleteCrime,
    getNearbyCrimes,
    getCrimeMapData
} = require("../controllers/crimeController");

router.post("/", authMiddleware, createCrime);
router.get("/", getAllCrimes);

// Literal paths must be registered before "/:id", or Express matches
// them as an id and getCrimeById rejects them as an invalid ObjectId.
router.get('/map', getCrimeMapData)
router.get('/nearby', authMiddleware, getNearbyCrimes)
router.get('/mine', authMiddleware, getMyCrimes)

router.get("/:id", getCrimeById);
router.delete("/:id", deleteCrime)

module.exports = router;
