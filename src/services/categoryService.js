import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL + "/categories";

export const getCategories = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getCategoryBySlug = async (slug) => {
  const res = await axios.get(`${API_URL}/${slug}`);
  return res.data;
};


export const createCategory = async (categoryData, token) => {
  const res = await axios.post(
    `${API_URL}/add-categories`,
    categoryData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
};

export const updateCategory = async (slug, categoryData, token) => {
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
};

export const deleteCategory = async (slug, token) => {
  const res = await axios.delete(`${API_URL}/${slug}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
