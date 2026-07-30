const express = require("express");

const router = express.Router();

const {getNearbyPoliceStations} = require("../controllers/policeController");

router.get("/nearby",getNearbyPoliceStations);

module.exports = router;