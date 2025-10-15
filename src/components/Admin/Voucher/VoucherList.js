// ...existing code...
import React, { useState } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Typography, Chip, Box, TablePagination, Tooltip
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'

const currency = (v) => new Intl.NumberFormat('vi-VN').format(v)

const VoucherList = ({ vouchers = [], onEdit, onDelete, onToggleActive }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleChangePage = (_, newPage) => setPage(newPage)
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10))
    setPage(0)
  }

  const visible = vouchers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 220 }}>Mã</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell align="right">Giá trị</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell align="right">Min đơn</TableCell>
              <TableCell align="center">Active</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box p={3} textAlign="center">
                    <Typography color="text.secondary">Không có voucher</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {visible.map(v => {
              const start = v.startAt ? new Date(v.startAt).toLocaleDateString() : '-'
              const end = v.endAt ? new Date(v.endAt).toLocaleDateString() : '-'
              return (
                <TableRow key={v._id} hover>
                  <TableCell>
                    <Typography fontWeight={700}>{v.code}</Typography>
                    {v.usageLimit !== null && (
                      <Typography variant="caption" color="text.secondary">Đã dùng: {v.usedCount || 0}/{v.usageLimit}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={v.type === 'percent' ? 'Phần trăm' : 'Giảm tiền'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    {v.type === 'percent' ? `${v.value}%` : currency(v.value)}
                    {v.maxDiscount ? <Typography component="span" variant="caption" color="text.secondary"> (max {currency(v.maxDiscount)})</Typography> : null}
                  </TableCell>
                  <TableCell>
                    <div>{start}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{end}</div>
                  </TableCell>
                  <TableCell align="right">{v.minOrderValue ? currency(v.minOrderValue) : '0'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title={v.active ? 'Đang hoạt động' : 'Tắt'}>
                      <IconButton size="small" onClick={() => onToggleActive(v._id)} color={v.active ? 'success' : 'default'}>
                        {v.active ? <ToggleOnIcon /> : <ToggleOffIcon />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Sửa"><IconButton size="small" onClick={() => onEdit(v)}><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Xóa"><IconButton size="small" color="error" onClick={() => onDelete(v._id)}><DeleteIcon /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={vouchers.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5,10,25]}
      />
    </Paper>
  )
}

export default VoucherList
// ...existing code...