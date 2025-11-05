import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL + "/products";
const VARIANT_API_URL = process.env.REACT_APP_API_URL + "/variants";

const getAuthToken = (token) => token || localStorage.getItem("auth_token");

// ============= PRODUCT APIs =============

// Lấy tất cả sản phẩm
export const getAllProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch all products");
  }
};

// Lấy tất cả sản phẩm với default variant
export const getAllProductsWithDefaultVariant = async () => {
  try {
    const response = await axios.get(`${API_URL}/default-variant`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch products with default variant");
  }
};

export const getProductsBySlug = async (slug, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 8,
      sortBy: params.sortBy || "createdAt",
      sortOrder: params.sortOrder || "desc",
      ...(params.minPrice && { minPrice: params.minPrice }),
      ...(params.maxPrice && { maxPrice: params.maxPrice }),
      ...(params.color && { color: params.color }),
      ...(params.size && { size: params.size }),
    });

    const response = await axios.get(`${API_URL}/${slug}?${queryParams}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch products");
  }
};

export const getProductDetailsBySlug = async (slug) => {
  try {
    const response = await axios.get(`${API_URL}/details/${slug}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch product details"
    );
  }
};

export const searchProducts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      q: params.q || "",
      page: params.page || 1,
      limit: params.limit || 20,
      sortBy: params.sortBy || "relevance",
      sortOrder: params.sortOrder || "desc",
      ...(params.minPrice && { minPrice: params.minPrice }),
      ...(params.maxPrice && { maxPrice: params.maxPrice }),
      ...(params.color && { color: params.color }),
      ...(params.size && { size: params.size }),
      ...(params.category && { category: params.category }),
    });

    const response = await axios.get(`${API_URL}/search?${queryParams}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to search products");
  }
};

// Authenticated actions use getAuthToken()

export const createProduct = async (productData, token) => {
  try {
    const auth = getAuthToken(token);
    const response = await axios.post(`${API_URL}/add-product`, productData, {
      headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create product");
  }
};

export const updateProduct = async (productId, productData, token) => {
  try {
    const auth = getAuthToken(token);
    const response = await axios.put(`${API_URL}/${productId}`, productData, {
      headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update product");
  }
};

export const deleteProduct = async (productId, token) => {
  try {
    const auth = getAuthToken(token);
    const response = await axios.delete(`${API_URL}/${productId}`, {
      headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete product");
  }
};

// ============= VARIANT APIs =============

export const createVariant = async (formData, token) => {
  try {
    const auth = getAuthToken(token);
    const response = await axios.post(`${VARIANT_API_URL}/add-variant`, formData, {
      headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create variant");
  }
};

export const addSizeToVariant = async (variantId, sizeData, token) => {
  try {
    const auth = getAuthToken(token);
    const response = await axios.post(
      `${VARIANT_API_URL}/${variantId}/sizes`,
      sizeData,
      {
        headers: {
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to add size to variant");
  }
};

export const updateSizeInVariant = async (variantId, sizeId, sizeData, token) => {
  try {
    const auth = getAuthToken(token);
    const response = await axios.put(
      `${VARIANT_API_URL}/${variantId}/sizes/${sizeId}`,
      sizeData,
      {
        headers: {
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update size");
  }
};

export const removeSizeFromVariant = async (variantId, sizeId, token) => {
  try {
    const auth = getAuthToken(token);
    const response = await axios.delete(
      `${VARIANT_API_URL}/${variantId}/sizes/${sizeId}`,
      {
        headers: {
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to remove size");
  }
};

export const updateVariantImages = async (variantId, formData, action = "append", token) => {
  try {
    const auth = getAuthToken(token);
    const response = await axios.put(
      `${VARIANT_API_URL}/${variantId}/images?action=${action}`,
      formData,
      {
        headers: {
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update variant images");
  }
};

export const getRecentlyViewedProducts = async (slugs = []) => {
  try {
    const response = await axios.post(`${API_URL}/recently-viewed`, { slugs });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch recently viewed products"
    );
  }
};