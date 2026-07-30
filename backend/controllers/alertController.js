const Alert = require("../models/Alert");

const createAlert = async (req, res) => {
    try {

        const {
            latitude,
            longitude,
            locationName,
            riskLevel,
            message
        } = req.body;

        const alert = new Alert({
            userId: req.user.id,
            latitude,
            longitude,
            locationName,
            riskLevel,
            message
        });

        await alert.save();

        res.status(201).json({
            message: "Alert created successfully",
            alert
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getAlerts = async (req, res) => {
    try {

        const alerts = await Alert.find({
            userId: req.user.id
        }).sort({
            createdAt: -1
        });

        res.status(200).json(alerts);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const resolveAlert = async (req, res) => {
    try {

        const alert = await Alert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({
                message: "Alert not found"
            });
        }

        alert.status = "Resolved";

        await alert.save();

        res.status(200).json({
            message: "Alert resolved successfully",
            alert
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};



module.exports = {
    createAlert,
    getAlerts,
    resolveAlert
};