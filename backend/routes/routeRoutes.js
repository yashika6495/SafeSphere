const express = require("express");
const router = express.Router();

const {getSafePath} = require("../controllers/routeController");

router.post("/safe-path", getSafePath);

module.exports = router;