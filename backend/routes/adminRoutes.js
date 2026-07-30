const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')

const {getDashBoardStats,getCrimeCategoryStats,getCrimeSeverityStats,getRecentCrimes} = require('../controllers/adminController')

router.get('/stats',authMiddleware,getDashBoardStats)
router.get('/crime-categories',authMiddleware,getCrimeCategoryStats)
router.get('/crime-severity',authMiddleware,getCrimeSeverityStats)
router.get('/recent-crimes',authMiddleware,getRecentCrimes)

module.exports = router 