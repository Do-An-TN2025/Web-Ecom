import axios from 'axios'

const BASE = process.env.REACT_APP_API_URL || ''
const API_URL = BASE + '/vouchers'

// axios instance
const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' }
})

// interceptor gắn token tự động từ localStorage (nếu có)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('auth_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  // nếu bạn muốn vẫn cho phép override token, caller có thể truyền headers trong options
  return config
}, err => Promise.reject(err))

// wrapper functions (token param optional for backwards-compat)
export const getVouchers = async (params = {}, token = null) => {
  const res = await api.get('/vouchers', { params, headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  return res.data
}

export const getVoucherById = async (id, token = null) => {
  const res = await api.get(`/vouchers/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  return res.data
}

export const createVoucher = async (voucherData, token = null) => {
  const res = await api.post('/vouchers', voucherData, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  return res.data
}

export const updateVoucher = async (id, voucherData, token = null) => {
  const res = await api.put(`/vouchers/${id}`, voucherData, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  return res.data
}

export const deleteVoucher = async (id, token = null) => {
  const res = await api.delete(`/vouchers/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  return res.data
}

export const applyVoucher = async (payload, token = null) => {
  const res = await api.post('/vouchers/apply', payload, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  return res.data
}

export const redeemVoucher = async (payload, token = null) => {
  const res = await api.post('/vouchers/redeem', payload, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  return res.data
}

export const getMyVouchers = async (token = null) => {
  const res = await api.get('/vouchers/my', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  return res.data
}

export default {
  getVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  applyVoucher,
  redeemVoucher,
  getMyVouchers
}