import axios from "axios";

const api = axios.create({
    baseURL: `http${import.meta.env.VITE_IS_HTTPS === 'yes' ? "s" : ""}://${import.meta.env.VITE_BACKEND_HOST}:${import.meta.env.VITE_BACKEND_PORT}/api` || 'http://localhost:8000'
    // baseURL: 'http://localhost:8000'
})
export default api;
