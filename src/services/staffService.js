import axiosInstance from './axiosInstance';

export const listStaffs = async ({ page = 1, limit = 20, role } = {}) => {
  const params = { page, limit };
  if (role) params.role = role;
  const { data } = await axiosInstance.get('/users/admin/staffs', { params });
  return data;
};

export const createStaffByAdmin = async (payload) => {
  const { data } = await axiosInstance.post('/users/admin/staffs', payload);
  return data;
};

export const updateStaff = async (id, payload) => {
  const { data } = await axiosInstance.put(`/users/admin/staffs/${id}`, payload);
  return data;
};

export const deleteStaff = async (id) => {
  const { data } = await axiosInstance.delete(`/users/admin/staffs/${id}`);
  return data;
};
