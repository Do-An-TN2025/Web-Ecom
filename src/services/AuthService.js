import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL + "/users";

export const loginService = async (data) => {
  const res = await axios.post(`${API_URL}/login`, data);
  return res.data;
};

export const registerService = async (data) => {
  const res = await axios.post(`${API_URL}/register`, data);
  return res.data;
};
