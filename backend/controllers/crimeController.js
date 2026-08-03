const Crime = require('../models/Crime')
const mongoose = require('mongoose')

const createCrime = async (req, res) => {
    try {
        const {
            category,
            description,
            latitude,
            longitude,
            severity,
            locationName
        } = req.body;

        const crime = new Crime({
            userId: req.user.id,
            category,
            description,
            latitude,
            longitude,
            severity,
            locationName
        });

        await crime.save();

        res.status(201).json({
            message: "Crime saved successfully",
            crime
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getAllCrimes = async (req,res)=>{
    try {
        const crimes = await Crime.find().populate('userId', 'name email')
        res.json(crimes)
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

/**
 * The signed-in user's own reports, newest first.
 *
 * Exists so the profile screen doesn't have to fetch every crime in the
 * database and filter client-side.
 */
const getMyCrimes = async (req, res) => {
    try {
        const crimes = await Crime.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(crimes);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getCrimeById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid Crime ID"
            });
        }

        const crime = await Crime.findById(req.params.id)
            .populate("userId", "name email");

        if (!crime) {
            return res.status(404).json({
                message: "Crime not found"
            });
        }

        res.status(200).json(crime);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const deleteCrime= async (req,res)=>{
    try {
        const crimes = await Crime.findById(req.params.id)
        if(!crimes){
            return res.status(500).json({
                message:'Crime not found'
            })
        }
        await Crime.findByIdAndDelete(req.params.id)

        res.status(200).json({
            message:'Crime deleted successfully'
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

const getDistance = (lat1, lon1, lat2, lon2) => {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}

const getNearbyCrimes = async (req, res) => {
    try {

        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                message: "Latitude and longitude are required"
            });
        }

        const crimes = await Crime.find();

        const nearbyCrimes = crimes.filter(crime => {

            const distance = getDistance(
                parseFloat(latitude),
                parseFloat(longitude),
                crime.latitude,
                crime.longitude
            );

            return distance <= 5; 

        });

        res.status(200).json({
            totalCrimes: nearbyCrimes.length,
            crimes: nearbyCrimes
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

/**
 * Buckets crimes into a grid for a density overlay.
 *
 * `precision` is decimal places of lat/lng, so it sets the cell size:
 *   3 -> ~110m   2 -> ~1.1km   1 -> ~11km
 * The default was 3, which is finer than reports cluster — nearly every
 * cell came back with a count of 1 and the "heatmap" was flat. 2 is the
 * useful default at city zoom.
 *
 * Cells carry a severity-weighted total as well as a raw count, so one
 * assault doesn't read the same as one pickpocketing.
 */
const getCrimeMapData = async (req, res) => {
    try {

        const requested = Number(req.query.precision ?? 2);
        const precision = Number.isFinite(requested)
            ? Math.min(4, Math.max(0, Math.trunc(requested)))
            : 2;

        const heatmapData = await Crime.aggregate([
            {
                $group: {
                    _id: {
                        latitude: {
                            $round: ["$latitude", precision]
                        },
                        longitude: {
                            $round: ["$longitude", precision]
                        }
                    },
                    crimeCount: {
                        $sum: 1
                    },
                    weight: {
                        $sum: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$severity", "High"] }, then: 3 },
                                    { case: { $eq: ["$severity", "Medium"] }, then: 2 }
                                ],
                                default: 1
                            }
                        }
                    },
                    categories: {
                        $addToSet: "$category"
                    }
                }
            },
            { $sort: { weight: -1 } }
        ]);

        res.status(200).json(heatmapData);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


module.exports = {
    createCrime,
    getAllCrimes,
    getMyCrimes,
    getCrimeById,
    deleteCrime,
    getNearbyCrimes,
    getCrimeMapData
}