import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL + "/categories";

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
    const res = await axios.post(
      `${API_URL}/add-categories`,
      categoryData,
      {
        headers: {
          Authorization: `Bearer ${token}`, // cần token admin
        },
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// Update category theo id hoặc slug (ở router bạn dùng slug → cần chỉnh lại cho khớp)
export const updateCategory = async (slug, categoryData, token) => {
  try {
    const res = await axios.put(
      `${API_URL}/${slug}`,
      categoryData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
    const res = await axios.delete(`${API_URL}/${slug}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};
