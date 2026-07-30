const Contact = require('../models/Contact')

const addContact = async (req,res) => {
    try {
        const {name,phone} = req.body

        const contact = new Contact({
            userId: req.user.id,
            name,
            phone
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

        const contacts = await Contact.find({userID: req.user.id})
        res.json(contacts)

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

const deleteContact = async (req,res) => {
    try {
        const contact = await Contact.findById(req.params.id)
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