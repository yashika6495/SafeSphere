import axios from "axios";

// Adjust if your server mounts routes under a different prefix —
// this assumes app.use('/api/<name>', <name>Routes) in server.js.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
    baseURL: BASE_URL,
});

// Attaches the JWT saved by AuthContext's login(token) call.
// If your AuthContext stores the token under a different
// localStorage key, update it here.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
