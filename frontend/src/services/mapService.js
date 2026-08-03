import API from "../api/api";

// Nearby Crimes
export const getNearbyCrime = async (latitude, longitude) => {
    const response = await API.get(
        `/crimes/nearby?latitude=${latitude}&longitude=${longitude}`
    );
    return response.data;
};

// Recent Crimes
export const getRecentCrime = async () => {
    const response = await API.get(
        "/admin/recent-crimes"
    );
    return response.data;
};

// Nearby Police
export const getNearbyPoliceStations = async (latitude, longitude) => {
    const response = await API.get(
        `/police/nearby?latitude=${latitude}&longitude=${longitude}`
    );
    return response.data;
};

// Safety Score
export const getSafetyScore = async (latitude, longitude) => {
    const response = await API.get(
        `/safety-score?lat=${latitude}&lng=${longitude}`
    );
    return response.data;
};

// Safety Tips
// Mounted at /api/safety/tips/:category in server.js — the old
// /safety-tips/:category path 404s, which used to take the whole
// map data load down with it.
export const getSafetyTips = async (category) => {
    const response = await API.get(
        `/safety/tips/${encodeURIComponent(category)}`
    );
    return response.data;
};

// Safe Route
export const getSafeRoute = async (
    sourceLatitude,
    sourceLongitude,
    destinationLatitude,
    destinationLongitude,
    mode = "walk"
) => {

    const response = await API.post("/routes/safe-path", {
        sourceLatitude,
        sourceLongitude,
        destinationLatitude,
        destinationLongitude,
        mode
    });

    return response.data;
};

// Crime density grid for the heat overlay.
// precision = decimal places of lat/lng: 2 ≈ 1.1km cells.
export const getCrimeHeatmap = async (precision = 2) => {
    const response = await API.get(`/crimes/map?precision=${precision}`);
    return response.data;
};

// Crime Severity
export const getCrimeSeverity = async () => {
    const response = await API.get("/admin/crime-severity");
    return response.data;
};

// Crime Categories
export const getCrimeCategories = async () => {
    const response = await API.get("/admin/crime-categories");
    return response.data;
};
// Place search, proxied through our API (Nominatim requires a
// User-Agent and rate-limits per caller — see backend/utils/geocode.js).
export const searchPlaces = async (query, latitude, longitude) => {
    const response = await API.get("/geocode/search", {
        params: { q: query, lat: latitude, lng: longitude },
    });
    return response.data;
};
