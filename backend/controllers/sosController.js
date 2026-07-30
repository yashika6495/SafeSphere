const SOS = require('../models/SOS')
const Alert = require('../models/Alert')

const createSOS = async (req,res) => {
    try {
        const {latitude, longitude} = req.body

        const sos = new SOS({
            userId: req.user.id,
            latitude,
            longitude
        })

        await sos.save()

        res.status(201).json({
            message: 'SOS triggered sucessfully',
            sos
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

const sendSOS = async (req,res) => {
    try {
        const {latitude,longitude} = req.body

        const alert = new Alert({
            userId: req.user.id,
            latitude,
            longitude,
            message:'Emergency SOS Trigged'
        })

        await alert.save()

        res.status(200).json({
            message: 'Emergency contact notified'
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

module.exports = {createSOS,sendSOS}