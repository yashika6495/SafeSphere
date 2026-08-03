const PoliceStation = require("../models/PoliceStation");

/**
 * Great-circle distance in kilometres.
 *
 * The previous version used Pythagoras on raw degrees, which isn't a
 * distance: a degree of longitude is ~111km at the equator and shrinks
 * to nothing at the poles, so the ordering was wrong away from it and
 * the number meant nothing anywhere. The UI was rendering it as "0.031°".
 */
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

// Average walking pace, km/h.
const WALK_KMH = 4.8;

const getNearbyPoliceStations = async (req,res) => {
    try {
        const { latitude,longitude } = req.query;

        if(!latitude || !longitude){
            return res.status(400).json({
                message:
                "Latitude and Longitude are required"
            });
        }

        const lat = Number(latitude);
        const lng = Number(longitude);

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            return res.status(400).json({
                message: "Latitude and Longitude must be numbers"
            });
        }

        const stations = await PoliceStation.find();

        const nearbyStations = stations
            .map((station) => {
                const km = distanceKm(
                    lat, lng,
                    station.latitude, station.longitude
                );

                return {
                    ...station._doc,
                    distanceKm: +km.toFixed(2),
                    walkMinutes: Math.round((km / WALK_KMH) * 60),
                };
            })
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 5);

        res.status(200).json(nearbyStations);

    } catch(error){
        res.status(500).json({
            message:error.message
        });

    }
};

module.exports = {
    getNearbyPoliceStations
};
