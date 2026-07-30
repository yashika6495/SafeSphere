import API from "../api/api";

export const getDashBoardStats = async () => {
    const response = await API.get("/admin/stats");
    return response.data;
}

export const getCrimeCategoryStats = async () => {
    const response = await API.get("/admin/crime-categories")
    return response.data
}

export const getCrimeSeverityStats = async () => {
    const response = await API.get("/admin/crime-severity")
    return response.data
}

export const getRecentCrimes = async () => {
    const response = await API.get("/admin/recent-crimes")
    return response.data
}