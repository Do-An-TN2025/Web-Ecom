import React, { useEffect, useMemo, useState, useRef } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";
import {
  Box,
  Paper,
  TextField,
  Select,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { getOrdersAdmin, updateOrderStatusAdmin } from "../../services/orderService";

const ORDER_STATUS = [
  { key: "pending", label: "Đang xử lý" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "shipped", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã huỷ" },
  { key: "completed", label: "Hoàn tất" },
];

const PAYMENT_LABEL = {
  paid: "Đã thanh toán",
  pending: "Chưa thanh toán",
  cancelled: "Đã huỷ",
  unknown: "Không rõ",
};

function paymentLabel(s) {
  return PAYMENT_LABEL[(s || "").toLowerCase()] || PAYMENT_LABEL.unknown;
}

function paymentColor(s) {
  const v = (s || "").toLowerCase();
  if (v === "paid") return "success";
  if (v === "pending") return "warning";
  if (v === "cancelled") return "default";
  return "default";
}

function formatDate(dt) {
  return dt ? new Date(dt).toLocaleString() : "-";
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all | paid | unpaid
  const [q, setQ] = useState("");
  const [snack, setSnack] = useState({ open: false, severity: "info", message: "" });
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const searchRef = useRef(null);
  const token = useMemo(() => localStorage.getItem("auth_token") || localStorage.getItem("token"), []);

  const fetch = async (opts = {}) => {
    setLoading(true);
    try {
      const page = opts.page ?? (meta.page || 1);
      const limit = opts.limit ?? (meta.limit || 20);
      const query = { page, limit };
      if (filter === "paid") query.paymentStatus = "paid";
      if (filter === "unpaid") query.paymentStatus = "pending";
      if (q) query.q = q;
      const res = await getOrdersAdmin(query, token);
      setOrders(res.data || []);
      setMeta(res.meta || { page, limit, total: 0, pages: 1 });
    } catch (err) {
      console.error(err);
      setSnack({ open: true, severity: "error", message: err?.message || "Lỗi khi tải đơn" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // debounce search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetch({ page: 1 }), 400);
    return () => clearTimeout(searchRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const handleChangePage = (_, newPageZeroBased) => {
    fetch({ page: newPageZeroBased + 1 });
  };

  const handleChangeRowsPerPage = (e) => {
    fetch({ page: 1, limit: Number(e.target.value) });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatusAdmin(orderId, { orderStatus: newStatus }, token);
      setSnack({ open: true, severity: "success", message: "Cập nhật trạng thái thành công" });
      fetch({ page: meta.page, limit: meta.limit });
    } catch (err) {
      console.error(err);
      setSnack({ open: true, severity: "error", message: err?.message || "Cập nhật thất bại" });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDetails = (order) => setSelectedOrder(order);
  const closeDetails = () => setSelectedOrder(null);

  // Layout constants to force fixed per-row height and fixed table body height based on rows per page
  const ROW_HEIGHT = 30 ; // px per table row
  const HEADER_HEIGHT = 26; // approximate header height (px)
  const rowsPerPage = meta.limit || 20;
  const tableBodyHeight = ROW_HEIGHT * rowsPerPage; // body area height
  const containerHeight = tableBodyHeight + HEADER_HEIGHT; // include header so TableContainer total height is stable

  // highlight helpers
  const isHighValue = (o) => Number(o.totalAmount ?? o.total ?? 0) >= 1000000;
  const isStaleUnpaid = (o) => {
    const pay = (o.paymentMethod?.status || o.payment?.status || "").toLowerCase();
    if (pay !== "pending") return false;
    if (!o.createdAt) return false;
    const hours = (Date.now() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60);
    return hours >= 48;
  };

  return (
    <AdminLayout>
      <Box p={3}>
        <Typography variant="h6" mb={2}>Quản lý đơn hàng</Typography>

        <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Tìm tên / điện thoại / email / mã đơn"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ width: 360 }}
          />
          <Select size="small" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="paid">Đã thanh toán</MenuItem>
            <MenuItem value="unpaid">Chưa thanh toán</MenuItem>
          </Select>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton onClick={() => fetch({ page: 1 })} title="Làm mới">
            <RefreshIcon />
          </IconButton>
        </Paper>

        <Paper>
          <TableContainer sx={{ height: containerHeight }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ height: HEADER_HEIGHT }}>
                  <TableCell>Mã</TableCell>
                  <TableCell>Khách</TableCell>
                  <TableCell align="right">Tiền</TableCell>
                  <TableCell>Thanh toán</TableCell>
                  <TableCell>Trạng thái đơn</TableCell>
                  <TableCell>Ngày</TableCell>
                  <TableCell align="center">Xem</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center"><CircularProgress size={28} /></TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Không có đơn hàng</TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => {
                    const payStatus = (o.paymentMethod?.status || o.payment?.status || "unknown").toLowerCase();
                    const payLabel = paymentLabel(payStatus);
                    const disabled = updatingId === (o._id || o.id);
                    const high = isHighValue(o);
                    const stale = isStaleUnpaid(o);

                    return (
                      <TableRow
                        key={o._id || o.orderCode}
                        hover
                        sx={{
                          height: ROW_HEIGHT,
                          bgcolor: high ? "rgba(255, 243, 205, 0.5)" : undefined,
                          borderLeft: stale ? 4 : 0,
                          borderLeftColor: stale ? "error.main" : undefined,
                        }}
                      >
                        <TableCell sx={{ maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box>
                              <Typography sx={{ fontWeight: 700 }}>{o.orderCode}</Typography>
                              {/* objectId intentionally hidden */}
                            </Box>
                            {payStatus === "pending" && (
                              <Chip label="Chưa thanh toán" color="error" size="small" />
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ maxWidth: 260 }}>
                          <div style={{ fontWeight: 600 }}>{o.shippingAddress?.fullName || "-"}</div>
                          <div style={{ fontSize: 12, color: "#666" }}>{o.shippingAddress?.phone || o.userId?.email || ""}</div>
                        </TableCell>

                        <TableCell align="right">{(o.totalAmount ?? o.total ?? 0).toLocaleString()} đ</TableCell>

                        <TableCell>
                          <Chip label={payLabel} color={paymentColor(payStatus)} size="small" />
                        </TableCell>

                        <TableCell>
                          <Select
                            size="small"
                            value={o.orderStatus || "pending"}
                            onChange={(e) => handleStatusChange(o._id || o.id, e.target.value)}
                            disabled={disabled}
                            sx={{
                              minWidth: 140,
                              ".MuiSelect-select": { display: "flex", alignItems: "center" },
                            }}
                          >
                            {ORDER_STATUS.map(s => (
                              <MenuItem key={s.key} value={s.key}>
                                {s.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>

                        <TableCell>{formatDate(o.createdAt)}</TableCell>

                        <TableCell align="center">
                          <IconButton size="small" title="Xem chi tiết" onClick={() => openDetails(o)}>
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={meta.total || 0}
            page={(meta.page || 1) - 1}
            onPageChange={handleChangePage}
            rowsPerPage={meta.limit || 20}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Số hàng / trang"
            labelDisplayedRows={({ from, to, count }) => `Tổng: ${count}`}
          />
        </Paper>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.message}</Alert>
        </Snackbar>

        {/* Chi tiết đơn hàng trong modal */}
        <Dialog open={!!selectedOrder} onClose={closeDetails} fullWidth maxWidth="md">
          <DialogTitle>Chi tiết đơn hàng {selectedOrder?.orderCode}</DialogTitle>
          <DialogContent dividers>
            {selectedOrder && (
              <Box>
                <Typography variant="subtitle2">Khách hàng</Typography>
                <Typography>{selectedOrder.shippingAddress?.fullName || "-"}</Typography>
                <Typography variant="caption" color="text.secondary">{selectedOrder.shippingAddress?.phone || selectedOrder.userId?.email || ""}</Typography>

                <Box mt={2}>
                  <Typography variant="subtitle2">Sản phẩm</Typography>
                  <List dense sx={{ maxHeight: 340, overflow: "auto" }}>
                    {(selectedOrder.items || []).map((it, idx) => (
                      <ListItem key={idx} divider>
                        <ListItemText
                          primary={`${it.name} × ${it.quantity}`}
                          secondary={`${(it.finalPrice ?? it.price ?? 0).toLocaleString()} đ`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Tổng: {(selectedOrder.totalAmount ?? selectedOrder.total ?? 0).toLocaleString()} đ</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={paymentLabel((selectedOrder.paymentMethod?.status || selectedOrder.payment?.status) || "unknown")} color={paymentColor(selectedOrder.paymentMethod?.status || selectedOrder.payment?.status)} size="small" />
                    <Chip label={ORDER_STATUS.find(s => s.key === (selectedOrder.orderStatus || "pending"))?.label || (selectedOrder.orderStatus || "Đang xử lý")} size="small" />
                  </Stack>
                </Box>

                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">Ghi chú:</Typography>
                  <Typography>{selectedOrder.customerNote || "-"}</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDetails}>Đóng</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}