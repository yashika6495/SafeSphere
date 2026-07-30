const express = require('express')
const router = express.Router()

const {getSafetyScore,getSafetyTips} = require('../controllers/safetyController')

router.get('/',getSafetyScore)
router.get('/tips/:category', getSafetyTips);

module.exports = router
