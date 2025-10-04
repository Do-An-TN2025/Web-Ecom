const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const updateVariant = async (variantId, formData, token) => {
  try {
    console.log('Updating variant:', variantId, 'with API_URL:', API_BASE);
    
    const response = await fetch(`${API_BASE}/variants/update-variant/${variantId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    console.log('Update variant success:', data);
    return data;

  } catch (error) {
    console.error('Error in updateVariant service:', error);
    throw error;
  }
};