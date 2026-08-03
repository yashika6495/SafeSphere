const Contact = require('../models/Contact')
const { normalizePhone, validatePhone } = require('../utils/phone')

const addContact = async (req,res) => {
    try {
        const {name,phone} = req.body

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                message: 'Contact name is required'
            })
        }

        const phoneError = validatePhone(phone)
        if (phoneError) {
            return res.status(400).json({
                message: phoneError
            })
        }

        const contact = new Contact({
            userId: req.user.id,
            name: String(name).trim(),
            phone: normalizePhone(phone)
        })

        await contact.save()

        res.status(201).json({
            message: 'Contact saved successfully',
            contact
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

const getContacts = async (req, res) => {
    try {

        // userId, not userID — the schema field is camelCase, and Mongoose
        // passed the typo straight through to Mongo, so this always
        // matched nothing and every user saw an empty contact list.
        const contacts = await Contact.find({userId: req.user.id})
        res.json(contacts)

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

const deleteContact = async (req,res) => {
    try {
        // Scoped to the caller: looking up by id alone let any signed-in
        // user delete anyone else's contacts just by guessing an id.
        const contact = await Contact.findOne({
            _id: req.params.id,
            userId: req.user.id
        })

        if(!contact){
            return res.status(404).json({
                message: 'Contact not found'
            })
        }
        await contact.deleteOne()
        res.json({
            message: 'Contact deleted sucessfully'
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

module.exports = {
    addContact,
    getContacts,
    deleteContact
}