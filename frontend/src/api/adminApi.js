import api from "./axiosInstance";

export const getDashboardStats = async () => {
    const res = await api.get("/admin/stats");
    return res.data;
};

export const getCrimeCategoryStats = async () => {
    const res = await api.get("/admin/crime-categories");
    return res.data;
};

export const getCrimeSeverityStats = async () => {
    const res = await api.get("/admin/crime-severity");
    return res.data;
};

export const getRecentCrimes = async () => {
    const res = await api.get("/admin/recent-crimes");
    return res.data;
};
