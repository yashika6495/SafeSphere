import api from "./axiosInstance";

export const getAlerts = async () => {
    const res = await api.get("/alerts");
    return res.data;
};

export const createAlert = async (alert) => {
    const res = await api.post("/alerts", alert);
    return res.data;
};

export const resolveAlert = async (id) => {
    const res = await api.put(`/alerts/${id}`);
    return res.data;
};
