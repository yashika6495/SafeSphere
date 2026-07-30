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
export const getSafetyTips = async (category) => {
    const response = await API.get(
        `/safety-tips/${category}`
    );
    return response.data;
};

// Safe Route
export const getSafeRoute = async (
    sourceLatitude,
    sourceLongitude,
    destinationLatitude,
    destinationLongitude
) => {

    const response = await API.post("/routes/safe-path", {
        sourceLatitude,
        sourceLongitude,
        destinationLatitude,
        destinationLongitude
    });

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