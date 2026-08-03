import API from "../api/api";

/**
 * Files a new report. Requires auth — the server stamps userId from the
 * token, so it is never sent from the client.
 *
 * Reports land with status "Pending". Nothing in the codebase can move
 * them off Pending yet, so they show on the map immediately.
 */
export const reportCrime = async ({
    category,
    description,
    latitude,
    longitude,
    severity,
    locationName,
}) => {
    const response = await API.post("/crimes", {
        category,
        description,
        latitude: Number(latitude),
        longitude: Number(longitude),
        severity,
        locationName,
    });
    return response.data;
};

/** The signed-in user's own reports, newest first. */
export const getMyCrimes = async () => {
    const response = await API.get("/crimes/mine");
    return response.data;
};

export const getAllCrimes = async () => {
    const response = await API.get("/crimes");
    return response.data;
};

export const getCrimeById = async (id) => {
    const response = await API.get(`/crimes/${id}`);
    return response.data;
};
