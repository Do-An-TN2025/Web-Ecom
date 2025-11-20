import axiosInstance from './axiosInstance';

const reviewService = {
  /**
   * Create or update a product review
   * @param {string} productId - Product ID
   * @param {number} rating - Rating from 1 to 5
   * @param {string} comment - Review comment
   * @param {string} token - Auth token
   * @returns {Promise}
   */
  createOrUpdateReview: async (productId, rating, comment, token) => {
    try {
      const response = await axiosInstance.post(
        `/products/${productId}/reviews`,
        {
          productId,
          rating,
          comment
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create/Update review error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get reviews for a product by slug
   * @param {string} slug - Product slug
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise}
   */
  getReviewsBySlug: async (slug, page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/products/${slug}/reviews`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Get reviews error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get reviews for a product by ID
   * @param {string} productId - Product ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise}
   */
  getReviewsById: async (productId, page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/products/${productId}/reviews`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Get reviews error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete a review by ID
   * @param {string} reviewId - Review ID
   * @param {string} token - Auth token
   * @returns {Promise}
   */
  deleteReview: async (reviewId, token) => {
    try {
      const response = await axiosInstance.delete(`/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Delete review error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Submit order review (multiple products)
   * @param {string} orderCode - Order code
   * @param {Object} reviewData - Review data containing overall rating and items
   * @param {string} token - Auth token
   * @returns {Promise}
   */
  submitOrderReview: async (orderCode, reviewData, token) => {
    try {
      const { overallRating, overallComment, items } = reviewData;

      // Submit review for each product in the order
      const promises = items.map(item => {
        return reviewService.createOrUpdateReview(
          item.productId,
          item.rating,
          item.comment,
          token
        );
      });

      const results = await Promise.allSettled(promises);
      
      // Check if all reviews were successful
      const failedReviews = results.filter(r => r.status === 'rejected');
      if (failedReviews.length > 0) {
        console.warn('Some reviews failed:', failedReviews);
      }

      return {
        success: true,
        message: 'Đánh giá đã được gửi thành công',
        results,
        successCount: results.filter(r => r.status === 'fulfilled').length,
        failedCount: failedReviews.length,
      };
    } catch (error) {
      console.error('Submit order review error:', error);
      throw error;
    }
  },

  /**
   * Check if user can review a product (has purchased and received it)
   * @param {string} productId - Product ID
   * @param {string} token - Auth token
   * @returns {Promise<boolean>}
   */
  canReviewProduct: async (productId, token) => {
    try {
      const response = await axiosInstance.get(
        `/products/${productId}/can-review`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.canReview || false;
    } catch (error) {
      console.error('Check review permission error:', error);
      return false;
    }
  },

  /**
   * Get latest five customer reviews (recent customers)
   * @returns {Promise}
   */
  getLatestFiveCustomerReviews: async () => {
    try {
      const response = await axiosInstance.get('/products/reviews/recent-customers');
      return response.data;
    } catch (error) {
      console.error('Get recent customer reviews error:', error);
      throw error.response?.data || error;
    }
  },
};

export default reviewService;
