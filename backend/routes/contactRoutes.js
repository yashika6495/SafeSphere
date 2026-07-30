const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')

const {addContact,getContacts,deleteContact} = require('../controllers/contactController')
const { route } = require('./authRoutes')

router.post('/',authMiddleware,addContact)
router.get('/',authMiddleware,getContacts)
router.delete('/:id',authMiddleware,deleteContact)

module.exports = router