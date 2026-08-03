const { searchPlaces, reverseGeocode } = require("../utils/geocode");

/**
 * Place search, proxied rather than called from the browser.
 *
 * Nominatim's policy requires an identifying User-Agent and caps callers
 * at one request per second — neither is enforceable from client code,
 * and going direct would also expose every user's typing to a third
 * party from their own IP. Proxying lets one shared cache and one rate
 * limiter cover everybody.
 */
const search = async (req, res) => {
    try {
        const { q, lat, lng } = req.query;

        if (!q || String(q).trim().length < 3) {
            return res.status(200).json([]);
        }

        const results = await searchPlaces(q, { lat, lng });
        res.status(200).json(results);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const reverse = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (lat == null || lng == null) {
            return res.status(400).json({
                message: "Latitude and longitude are required"
            });
        }

        res.status(200).json({ name: await reverseGeocode(lat, lng) });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { search, reverse };
