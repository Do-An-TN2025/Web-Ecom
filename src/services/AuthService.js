import axios from "axios";

const BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "auth_token";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem(TOKEN_KEY);
  }
};

const persistAuth = (data) => {
  if (data?.token) {
    setAuthToken(data.token); // chỉ gọi setAuthToken
  }
  if (data?.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
};

// ---- AUTH ----
export const loginService = async (payload) => {
  const { data } = await api.post("/users/login", payload);
  persistAuth(data);
  return data;
};

export const registerService = async (payload) => {
  const { data } = await api.post("/users/register", payload);
  persistAuth(data);
  return data;
};

export const socialLoginService = async (idToken) => {
  const { data } = await api.post("/users/social-login", { idToken });
  persistAuth(data);
  return data;
};

export const registerAdminService = async (payload) => {
  const { data } = await api.post("/users/register-admin", payload);
  return data;
};

// ---- PROFILE ----
export const getMeService = async () => {
  const { data } = await api.get("/users/me");
  return data;
};

export const updateMeService = async (payload) => {
  const { data } = await api.put("/users/me", payload);
  return data;
};

// ---- ADDRESSES ----
export const getAddressesService = async () => {
  const { data } = await api.get("/users/address");
  return data;
};
export const addAddressService = async (payload) => {
  const { data } = await api.post("/users/address", payload);
  return data;
};
export const updateAddressService = async (id, payload) => {
  const { data } = await api.put(`/users/address/${id}`, payload);
  return data;
};
export const deleteAddressService = async (id) => {
  const { data } = await api.delete(`/users/address/${id}`);
  return data;
};
export const setDefaultAddressService = async (id) => {
  const { data } = await api.patch(`/users/address/${id}/default`);
  return data;
};

// ---- TOKEN HELPER ----
export const applyTokenFromStorage = () => {
  const token =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  if (token) setAuthToken(token);
  return token;
};


export const getWishlistService = async () => {
  const { data } = await api.get("/users/wishlist");
  return data;
};

export const addToWishlistService = async (payload) => {
  const { data } = await api.post("/users/wishlist", payload);
  return data;
};

export const removeFromWishlistService = async (payload) => {
  const { data } = await api.delete("/users/wishlist", { data: payload });
  return data;
};

export const logoutService = () => {
  setAuthToken(null);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("user");
};