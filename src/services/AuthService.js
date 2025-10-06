import axios from "axios";

const BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const API_URL = `${BASE_URL}/users`;

// Optional: axios instance (reuse headers, interceptors later)
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false
});

// Helper: set / clear Authorization header globally for this instance
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

/* ========== AUTH ========== */
export const loginService = async (data) => {
  const { data: res } = await api.post(`/users/login`, data);
  return res;
};

export const registerService = async (data) => {
  const { data: res } = await api.post(`/users/register`, data);
  return res;
};

export const registerAdminService = async (data) => {
  // Requires admin token already set via setAuthToken
  const { data: res } = await api.post(`/users/register-admin`, data);
  return res;
};

/* ========== PROFILE ========== */
export const getMeService = async () => {
  const { data } = await api.get(`/users/me`);
  return data;
};

export const updateMeService = async (payload) => {
  const { data } = await api.put(`/users/me`, payload);
  return data;
};

/* ========== ADDRESSES ========== */
export const getAddressesService = async () => {
  const { data } = await api.get(`/users/address`);
  return data; // array
};

export const addAddressService = async (payload) => {
  const { data } = await api.post(`/users/address`, payload);
  return data; // updated array
};

export const updateAddressService = async (addressId, payload) => {
  const { data } = await api.put(`/users/address/${addressId}`, payload);
  return data;
};

export const deleteAddressService = async (addressId) => {
  const { data } = await api.delete(`/users/address/${addressId}`);
  return data;
};

export const setDefaultAddressService = async (addressId) => {
  const { data } = await api.patch(`/users/address/${addressId}/default`);
  return data;
};

/* ========== UTILS (optional wrappers) ========== */
export const applyTokenFromStorage = () => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");
  if (token) setAuthToken(token);
};

export const logoutService = () => {
  setAuthToken(null);
  localStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_token");
};
