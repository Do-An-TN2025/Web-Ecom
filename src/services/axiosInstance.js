import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://sever-ecommerce.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token from localStorage for each request if present
axiosInstance.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // ignore (e.g., localStorage not available)
  }
  return config;
}, (error) => Promise.reject(error));

export function setAxiosAuthToken(token) {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
}

export default axiosInstance;
