import api from "../axiosInstance";

export const getProfile = async () => {
    const res = await api.get("/auth/profile");
    return res.data;
};
