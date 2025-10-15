// ...existing code...
import React, { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../AdminLayout'
import VoucherList from './VoucherList'
import VoucherForm from './VoucherForm'
import voucherApi from '../../../services/voucherService'

import {
  Container, Box, Stack, Typography, Button, TextField, FormControlLabel, Switch,
  Paper, IconButton, Snackbar, Alert, Divider
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FilterListIcon from '@mui/icons-material/FilterList'
import RefreshIcon from '@mui/icons-material/Refresh'

const Voucher = () => {
  const [vouchers, setVouchers] = useState([])
  const [q, setQ] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' })

  // get token from localStorage (adjust if you use redux/context)
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken')

   const load = useCallback(async () => {
    try {
      // pass query params if needed
      const params = {}
      // chỉ gửi param active khi filter "Chỉ hiển thị active" bật
      if (activeOnly === true) params.active = true
      if (q) params.q = q
      const data = await voucherApi.getVouchers(params, token)
      setVouchers(data)
    } catch (err) {
      setSnack({ open: true, message: err?.message || 'Lỗi khi tải vouchers', severity: 'error' })
    }
  }, [q, activeOnly, token])

  useEffect(() => {
    load()
  }, [load])

  const handleSearch = (e) => setQ(e.target.value)

  const filtered = vouchers.filter(v => {
    if (activeOnly && !v.active) return false
    if (!q) return true
    return v.code?.toLowerCase().includes(q.toLowerCase())
  })

  const openCreate = () => {
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    try {
      await voucherApi.deleteVoucher(id, token)
      setSnack({ open: true, message: 'Đã xóa voucher', severity: 'success' })
      await load()
    } catch (err) {
      setSnack({ open: true, message: err?.response?.data?.message || err?.message || 'Xóa thất bại', severity: 'error' })
    }
  }

  const handleToggleActive = async (id) => {
    try {
      const v = vouchers.find(x => x._id === id)
      if (!v) return
      await voucherApi.updateVoucher(id, { active: !v.active }, token)
      setSnack({ open: true, message: `Đã ${v.active ? 'tắt' : 'bật'} voucher`, severity: 'success' })
      await load()
    } catch (err) {
      setSnack({ open: true, message: err?.response?.data?.message || err?.message || 'Cập nhật thất bại', severity: 'error' })
    }
  }

  const handleSave = async (data) => {
    try {
      if (editing) await voucherApi.updateVoucher(editing._id, data, token)
      else await voucherApi.createVoucher(data, token)
      setShowForm(false)
      setSnack({ open: true, message: editing ? 'Cập nhật voucher thành công' : 'Tạo voucher thành công', severity: 'success' })
      await load()
    } catch (err) {
      setSnack({ open: true, message: err?.response?.data?.message || err?.message || 'Lưu thất bại', severity: 'error' })
    }
  }

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={700}>Quản lý khuyến mãi</Typography>
              <Typography variant="body2" color="text.secondary">Tạo, sửa, quản lý mã giảm giá cho cửa hàng</Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton onClick={load} title="Làm mới"><RefreshIcon /></IconButton>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Tạo voucher</Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={2}>
            <TextField
              value={q}
              onChange={handleSearch}
              placeholder="Tìm mã voucher..."
              size="small"
              sx={{ flex: 1 }}
              InputProps={{ startAdornment: <FilterListIcon sx={{ mr: 1, color: 'action.active' }} /> }}
            />
            <FormControlLabel
              control={<Switch checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />}
              label="Chỉ hiển thị active"
            />
          </Stack>

          <VoucherList
            vouchers={filtered}
            onEdit={openEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        </Paper>

        <VoucherForm
          open={showForm}
          initial={editing}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        </Snackbar>
      </Container>
    </AdminLayout>
  )
}

export default Voucher