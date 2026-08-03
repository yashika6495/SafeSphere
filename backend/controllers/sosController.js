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

/**
 * Records the SOS as an alert. DOES NOT NOTIFY ANYONE.
 *
 * There is no SMS, voice, email or push provider wired into this backend.
 * This used to reply "Emergency contact notified", which was false and
 * dangerous — a caller in trouble would have every reason to believe help
 * was coming. Until a real dispatch path exists, the response says
 * exactly what happened and nothing more.
 */
const sendSOS = async (req,res) => {
    try {
        const {latitude,longitude} = req.body

        const alert = new Alert({
            userId: req.user.id,
            latitude,
            longitude,
            message:'Emergency SOS triggered'
        })

        await alert.save()

        res.status(200).json({
            message: 'SOS recorded. No contacts were notified — no messaging provider is connected.',
            notified: false,
            alert
        })

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

module.exports = {createSOS,sendSOS}