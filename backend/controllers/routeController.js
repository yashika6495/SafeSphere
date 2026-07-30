const Crime = require("../models/Crime");

const getSafePath = async (req, res) => {
    try {
        const {
            sourceLatitude,
            sourceLongitude,
            destinationLatitude,
            destinationLongitude
        } = req.body;

        if (
            sourceLatitude == null ||
            sourceLongitude == null ||
            destinationLatitude == null ||
            destinationLongitude == null
        ) {
            return res.status(400).json({
                message: "All coordinates are required"
            });
        }

        const srcLat = Number(sourceLatitude);
        const srcLng = Number(sourceLongitude);
        const destLat = Number(destinationLatitude);
        const destLng = Number(destinationLongitude);

        const crimes = await Crime.find();

        let crimeCount = 0;
        let riskScore = 0;

        const minLat = Math.min(srcLat, destLat);
        const maxLat = Math.max(srcLat, destLat);

        const minLng = Math.min(srcLng, destLng);
        const maxLng = Math.max(srcLng, destLng);

        const severityWeight = {
            High: 5,
            Medium: 3,
            Low: 1
        };

        crimes.forEach((crime) => {
            if (
                crime.latitude >= minLat &&
                crime.latitude <= maxLat &&
                crime.longitude >= minLng &&
                crime.longitude <= maxLng
            ) {
                crimeCount++;
                riskScore += severityWeight[crime.severity] || 1;
            }
        });

        let riskLevel = "Low";

        if (riskScore > 30) {
            riskLevel = "High";
        } else if (riskScore > 15) {
            riskLevel = "Medium";
        }

        res.status(200).json({
            source: {
                latitude: srcLat,
                longitude: srcLng
            },
            destination: {
                latitude: destLat,
                longitude: destLng
            },
            crimeCount,
            riskScore,
            riskLevel,
            route: {
                source: [srcLat, srcLng],
                destination: [destLat, destLng]
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    getSafePath
};