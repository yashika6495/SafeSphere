const Crime = require('../models/Crime')

const getSafetyScore = async (req,res) => {
    try {
        const {lat,lng} = req.query

        if(!lat || !lng){
            return res.status(400).json({
                message: 'Latitude and Longitude are required"'
            })
        }

        const latitude = Number(lat);
        const longitude = Number(lng);

        const nearbyCrimes = await Crime.find({
            latitude: {
                $gte: latitude - 0.05,
                $lte: latitude + 0.05
            },
            longitude: {
                $gte: longitude - 0.05,
                $lte: longitude + 0.05
            }
        })

        let score = 100

        nearbyCrimes.forEach((crime)=>{
            switch (crime.severity){
                case "Low": score = score - 5;
                            break;
                case "Medium": score = score - 10;
                               break;
                case "High": score = score - 20;
                             break;
                default : score = score - 5;
            }
        })

        if (score < 0) {
            score = 0;
        }

        let riskLevel;
        let message;

        if (score >= 80) {
            riskLevel = "Safe";
            message = "This area appears to be safe.";
        }
        else if (score >= 50) {
            riskLevel = "Medium";
            message = "Be cautious, especially at night.";
        }
        else {
            riskLevel = "High";
            message = "High crime activity detected in this area.";
        }

        res.status(200).json({
            crimeCount: nearbyCrimes.length,
            score,
            riskLevel,
            message,
            nearbyCrimes
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

const getSafetyTips = async (req, res) => {
    try {

        const { category } = req.params;

        const safetyTips = {

            Theft: {
                riskLevel: "Medium",
                tips: [
                    "Avoid displaying expensive items.",
                    "Keep your belongings secure.",
                    "Stay alert in crowded places.",
                    "Use anti-theft bags.",
                    "Report theft immediately."
                ]
            },

            Robbery: {
                riskLevel: "High",
                tips: [
                    "Avoid isolated streets.",
                    "Do not carry large amounts of cash.",
                    "Stay in well-lit areas.",
                    "Do not resist armed robbers.",
                    "Call police immediately."
                ]
            },

            Harassment: {
                riskLevel: "High",
                tips: [
                    "Move to a crowded place.",
                    "Call trusted contacts.",
                    "Use the SOS feature.",
                    "Record evidence if safe.",
                    "Report the incident immediately."
                ]
            },

            Kidnapping: {
                riskLevel: "Critical",
                tips: [
                    "Share your live location.",
                    "Avoid travelling alone at night.",
                    "Use trusted transportation.",
                    "Keep emergency contacts informed.",
                    "Trigger SOS immediately."
                ]
            },

            Assault: {
                riskLevel: "Critical",
                tips: [
                    "Move to a safe location.",
                    "Call emergency services.",
                    "Seek medical attention.",
                    "Preserve evidence.",
                    "File a police complaint."
                ]
            },

            Stalking: {
                riskLevel: "High",
                tips: [
                    "Avoid isolated places.",
                    "Inform family members.",
                    "Document suspicious behaviour.",
                    "Use public transport.",
                    "Contact police."
                ]
            },

            "Domestic Violence": {
                riskLevel: "Critical",
                tips: [
                    "Contact Women's Helpline.",
                    "Go to a safe location.",
                    "Inform trusted relatives.",
                    "Call emergency services.",
                    "File a complaint."
                ]
            },

            "Cyber Crime": {
                riskLevel: "Medium",
                tips: [
                    "Do not share OTP.",
                    "Enable two-factor authentication.",
                    "Change passwords immediately.",
                    "Block suspicious users.",
                    "Report cybercrime."
                ]
            },

            "Chain Snatching": {
                riskLevel: "Medium",
                tips: [
                    "Avoid wearing valuable jewellery openly.",
                    "Walk away from roadside traffic.",
                    "Stay alert around motorcycles.",
                    "Note vehicle details.",
                    "Report immediately."
                ]
            },

            "Eve Teasing": {
                riskLevel: "High",
                tips: [
                    "Move to a crowded place.",
                    "Avoid confrontation if unsafe.",
                    "Use SOS immediately.",
                    "Seek help from nearby people.",
                    "Report the offender."
                ]
            }

        };

        const result = safetyTips[category];

        if (!result) {
            return res.status(404).json({
                message: "Crime category not found"
            });
        }

        res.status(200).json({
            crimeType: category,
            riskLevel: result.riskLevel,
            tips: result.tips
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


module.exports = {getSafetyScore,getSafetyTips}