// ...existing code...
import React, { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, MenuItem, FormControlLabel, Switch, Typography, Divider, Box
} from '@mui/material'

const empty = {
  code: '',
  type: 'percent',
  value: 0,
  maxDiscount: '',
  startAt: '',
  endAt: '',
  minOrderValue: 0,
  active: true,
  usageLimit: '',
  perUserLimit: ''
}

const VoucherForm = ({ open = false, initial = null, onSave, onClose }) => {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
        maxDiscount: initial.maxDiscount ?? '',
        usageLimit: initial.usageLimit ?? '',
        perUserLimit: initial.perUserLimit ?? '',
        startAt: initial.startAt ? new Date(initial.startAt).toISOString().slice(0,10) : '',
        endAt: initial.endAt ? new Date(initial.endAt).toISOString().slice(0,10) : ''
      })
    } else setForm(empty)
    setErrors({})
  }, [initial, open])

  const handle = (k, v) => setForm(s => ({ ...s, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.code || !form.code.trim()) e.code = 'Mã không được để trống'
    if (form.value === '' || isNaN(Number(form.value)) || Number(form.value) < 0) e.value = 'Giá trị không hợp lệ'
    if (form.type === 'percent' && form.maxDiscount !== '' && Number(form.maxDiscount) < 0) e.maxDiscount = 'Không hợp lệ'
    if (form.startAt && form.endAt && new Date(form.startAt) > new Date(form.endAt)) e.endAt = 'Kết thúc phải sau bắt đầu'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      ...form,
      value: Number(form.value),
      maxDiscount: form.maxDiscount !== '' ? Number(form.maxDiscount) : undefined,
      minOrderValue: Number(form.minOrderValue || 0),
      usageLimit: form.usageLimit !== '' ? Number(form.usageLimit) : null,
      perUserLimit: form.perUserLimit !== '' ? Number(form.perUserLimit) : null,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      code: form.code?.toString().trim().toUpperCase()
    }
    onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{initial ? 'Sửa voucher' : 'Tạo voucher'}</DialogTitle>
      <form onSubmit={submit}>
        <DialogContent dividers>
          <Box mb={1}>
            <Typography variant="caption" color="text.secondary">Thiết lập thông tin voucher & điều kiện áp dụng</Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                label="Mã"
                fullWidth
                value={form.code}
                onChange={e => handle('code', e.target.value)}
                error={!!errors.code}
                helperText={errors.code}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Loại" fullWidth value={form.type} onChange={e => handle('type', e.target.value)}>
                <MenuItem value="percent">Phần trăm (%)</MenuItem>
                <MenuItem value="fixed">Giảm tiền cố định</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                type="number"
                label="Giá trị"
                fullWidth
                value={form.value}
                onChange={e => handle('value', e.target.value)}
                error={!!errors.value}
                helperText={errors.value}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                label="Max giảm (nếu có)"
                fullWidth
                value={form.maxDiscount}
                onChange={e => handle('maxDiscount', e.target.value)}
                error={!!errors.maxDiscount}
                helperText={errors.maxDiscount}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="Bắt đầu"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={form.startAt}
                onChange={e => handle('startAt', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="Kết thúc"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={form.endAt}
                onChange={e => handle('endAt', e.target.value)}
                error={!!errors.endAt}
                helperText={errors.endAt}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField type="number" label="Min đơn (VND)" fullWidth value={form.minOrderValue} onChange={e => handle('minOrderValue', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField type="number" label="Usage limit" fullWidth value={form.usageLimit} onChange={e => handle('usageLimit', e.target.value)} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField type="number" label="Per user limit" fullWidth value={form.perUserLimit} onChange={e => handle('perUserLimit', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6} alignItems="center" style={{ display: 'flex' }}>
              <FormControlLabel control={<Switch checked={!!form.active} onChange={e => handle('active', e.target.checked)} />} label="Active" />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle2">Xem trước</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {form.code ? `${form.code.toUpperCase()} · ${form.type === 'percent' ? `${form.value}%` : `${new Intl.NumberFormat('vi-VN').format(form.value)} VND`}` : 'Mã sẽ hiển thị ở đây khi nhập'}
              {form.maxDiscount ? ` · max ${new Intl.NumberFormat('vi-VN').format(Number(form.maxDiscount))} VND` : ''}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="contained">Lưu</Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default VoucherForm
// ...existing code...