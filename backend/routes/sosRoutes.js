const express = require('express')
const router = express.Router()


const {createSOS,sendSOS} = require('../controllers/sosController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/',authMiddleware,createSOS)
router.post('/send',authMiddleware,sendSOS)

module.exports = router
