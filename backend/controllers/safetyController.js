const Crime = require('../models/Crime')

// Reports beyond this contribute nothing to the score.
const RADIUS_KM = 3;

// Controls how fast the score falls as risk accumulates. Larger = more
// forgiving. Calibrated so a busy city-centre district lands in the 20s
// and an ordinary residential street lands in the 60-80s.
const DECAY = 12;

// Band thresholds. Deliberately conservative: in a safety app, calling a
// risky area "Safe" is far worse than calling a fine one "Medium".
const SAFE_AT = 75;
const MEDIUM_AT = 45;

// A recent report matters roughly twice as much as one this many days old.
const HALF_LIFE_DAYS = 45;

const SEVERITY_WEIGHT = { High: 3, Medium: 1.8, Low: 1 };

const distanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Scores an area 0-100, where 100 is untroubled.
 *
 * The earlier version subtracted a flat 5/10/20 per report inside a
 * ±0.05° box. That works while the database is nearly empty and breaks
 * completely once it isn't: ~90 reports in a busy district drives the
 * total past -1000, every populated area clamps to 0, and the score
 * stops distinguishing a rough street from a quiet one.
 *
 * Instead each report contributes severity × proximity × recency, and
 * the total is mapped through a decaying exponential. That never goes
 * negative, never saturates, and keeps ranking areas against each other
 * however much data accumulates.
 */
const getSafetyScore = async (req,res) => {
    try {
        const {lat,lng} = req.query

        if(!lat || !lng){
            return res.status(400).json({
                message: 'Latitude and Longitude are required'
            })
        }

        const latitude = Number(lat);
        const longitude = Number(lng);

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return res.status(400).json({
                message: 'Latitude and Longitude must be numbers'
            })
        }

        // Cheap bounding-box prefilter, then an exact radius check.
        const delta = RADIUS_KM / 111;

        const candidates = await Crime.find({
            latitude:  { $gte: latitude - delta,  $lte: latitude + delta },
            longitude: { $gte: longitude - delta, $lte: longitude + delta }
        })

        const now = Date.now();
        let impact = 0;

        const nearbyCrimes = [];

        for (const crime of candidates) {
            const distance = distanceKm(
                latitude, longitude,
                crime.latitude, crime.longitude
            );

            if (distance > RADIUS_KM) continue;

            const proximity = 1 - distance / RADIUS_KM;

            const ageDays =
                (now - new Date(crime.createdAt).getTime()) / 86400000;
            const recency = Math.pow(0.5, Math.max(0, ageDays) / HALF_LIFE_DAYS);

            impact +=
                (SEVERITY_WEIGHT[crime.severity] ?? 1) * proximity * recency;

            nearbyCrimes.push({ crime, distance });
        }

        // Hyperbolic rather than exponential falloff. An exponential curve
        // collapses to single digits across every populated district, which
        // makes the score useless in exactly the places people check it.
        // This decays gently and keeps ranking dense areas against each other.
        const score = Math.round(100 / (1 + impact / DECAY));

        let riskLevel;
        let message;

        if (score >= SAFE_AT) {
            riskLevel = "Safe";
            message = "Few reports around here. Usual awareness applies.";
        }
        else if (score >= MEDIUM_AT) {
            riskLevel = "Medium";
            message = "Some recent activity nearby — take care after dark.";
        }
        else {
            riskLevel = "High";
            message = "Heavy concentration of recent reports in this area.";
        }

        nearbyCrimes.sort((a, b) => a.distance - b.distance);

        res.status(200).json({
            crimeCount: nearbyCrimes.length,
            score,
            riskLevel,
            message,
            radiusKm: RADIUS_KM,
            // Closest handful only — the full set can run to hundreds.
            nearbyCrimes: nearbyCrimes.slice(0, 20).map((n) => n.crime)
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