import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL + "/categories";

const getAuthToken = (token) => token || localStorage.getItem("auth_token");

export const getCategories = async () => {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const getCategoryBySlug = async (slug) => {
  try {
    const res = await axios.get(`${API_URL}/${slug}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// Thêm category mới
export const createCategory = async (categoryData, token) => {
  try {
    const auth = getAuthToken(token);
    const res = await axios.post(
      `${API_URL}/add-categories`,
      categoryData,
      {
        headers: {
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        },
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// Update category theo id hoặc slug
export const updateCategory = async (slug, categoryData, token) => {
  try {
    const auth = getAuthToken(token);
    const res = await axios.put(
      `${API_URL}/${slug}`,
      categoryData,
      {
        headers: {
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        },
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// Xóa category
export const deleteCategory = async (slug, token) => {
  try {
    const auth = getAuthToken(token);
    const res = await axios.delete(`${API_URL}/${slug}`, {
      headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};