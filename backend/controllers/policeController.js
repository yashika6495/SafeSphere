const PoliceStation = require("../models/PoliceStation");

const getNearbyPoliceStations = async (req,res) => {
    try {
        const { latitude,longitude } = req.query;

        if(!latitude || !longitude){
            return res.status(400).json({
                message:
                "Latitude and Longitude are required"
            });
        }

        const stations = await PoliceStation.find();

        const nearbyStations = stations.map(station => {

            const distance = Math.sqrt(Math.pow(station.latitude - latitude,2) +
                Math.pow(station.longitude - longitude,2)
            );

            return {...station._doc,distance};
        });

        nearbyStations.sort((a,b) => a.distance - b.distance);

        res.status(200).json(nearbyStations.slice(0,5));
        
    } catch(error){
        res.status(500).json({
            message:error.message
        });

    }
};

module.exports = {
    getNearbyPoliceStations
};