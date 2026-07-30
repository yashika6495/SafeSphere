import api from "../axiosInstance";

export const getNearbyPoliceStations = async (latitude, longitude) => {
    const res = await api.get("/police/nearby", {
        params: { latitude, longitude },
    });
    return res.data;
};
