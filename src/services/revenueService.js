import axios from "axios";

const BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "auth_token";

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: false,
});

// attach token from storage to requests (call before request)
const attachAuth = () => {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete api.defaults.headers.common["Authorization"];
};

const handleError = (err) => {
    // normalize error to thrown payload (caller can inspect .message / .response)
    if (err?.response?.data) throw err.response.data;
    throw err;
};

export const getAdminOverview = async () => {
    try {
        attachAuth();
        const { data } = await api.get("/admin/stats/overview");
        return data;
    } catch (err) {
        handleError(err);
    }
};

export const getSalesByPeriod = async ({ period = "day", range = 30 } = {}) => {
    try {
        attachAuth();
        const { data } = await api.get("/admin/stats/sales", {
            params: { period, range },
        });
        return data;
    } catch (err) {
        handleError(err);
    }
};

export const getTopProducts = async ({ limit = 10, periodDays = 90 } = {}) => {
    try {
        attachAuth();
        const { data } = await api.get("/admin/stats/top-products", {
            params: { limit, periodDays },
        });
        return data;
    } catch (err) {
        handleError(err);
    }
};

export const getTopCustomers = async ({ limit = 10, periodDays = 90 } = {}) => {
    try {
        attachAuth();
        const { data } = await api.get("/admin/stats/top-customers", {
            params: { limit, periodDays },
        });
        return data;
    } catch (err) {
        handleError(err);
    }
};

export const getSlowProducts = async ({ limit = 20, periodDays = 90 } = {}) => {
    try {
        attachAuth();
        const { data } = await api.get("/admin/stats/slow-products", {
            params: { limit, periodDays },
        });
        return data;
    } catch (err) {
        handleError(err);
    }
};

export const getRevenueForecast = async ({ period = undefined, limit = 1 } = {}) => {
    try {
        attachAuth();
        const params = {};
        if (period) params.period = period;
        if (limit) params.limit = limit;
        const { data } = await api.get("/admin/stats/forecast", { params });
        return data;
    } catch (err) {
        handleError(err);
    }
};

export const exportStatsExcel = async (params = {}) => {
    try {
        attachAuth();
        const res = await api.get("/admin/stats/export-excel", {
            params,
            responseType: 'blob',
        });
        return res.data; // Blob
    } catch (err) {
        handleError(err);
    }
};

export default {
    getAdminOverview,
    getSalesByPeriod,
    getTopProducts,
    getRevenueForecast,
    exportStatsExcel,
};