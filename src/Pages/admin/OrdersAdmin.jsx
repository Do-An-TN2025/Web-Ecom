import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
  Tabs,
  Tab,
  Badge,
  InputAdornment,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { getOrdersAdmin, updateOrderStatusAdmin } from "../../services/orderService";

/**
 * Enum các trạng thái đơn (Backend / model)
 */
const ORDER_ENUM = ["pending", "confirmed", "shipped", "delivered", "cancelled", "completed", "reported"];

const ORDER_STATUS = [
  { key: "pending", label: "Chờ xử lý" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "shipped", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã huỷ" },
  { key: "completed", label: "Hoàn tất" },
  { key: "reported", label: "Đã báo cáo" },
];

const PAYMENT_LABEL = {
  paid: "Đã thanh toán",
  pending: "Chưa thanh toán",
  cancelled: "Đã huỷ",
  failed: "Thất bại",
  unknown: "Không rõ",
};

const TAB_CONFIG = [
  { value: "all", label: "Tất cả" },
  // đã xóa "unconfirmed" và "processing" theo yêu cầu
  { value: "pending", label: "Chờ xử lý" }, // đếm đơn pending
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "shipped", label: "Đang giao" },
  { value: "delivered", label: "Đã giao" },
  { value: "completed", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã huỷ" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "reported", label: "Có vấn đề", color: "warning" },
];

function paymentLabel(s) {
  return PAYMENT_LABEL[(s || "").toLowerCase()] || PAYMENT_LABEL.unknown;
}

function paymentColor(s) {
  const v = (s || "").toLowerCase();
  if (v === "paid") return "success";
  if (v === "pending") return "warning";
  if (v === "failed") return "error";
  if (v === "cancelled") return "default";
  return "default";
}

function formatDate(dt) {
  return dt ? new Date(dt).toLocaleString("vi-VN") : "-";
}

function formatCurrency(amount) {
  return (amount || 0).toLocaleString("vi-VN") + " đ";
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 1, totalAmount: 0, pageTotal: 0 });
  const [tabs, setTabs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateFilter, setDateFilter] = useState("");
  const [snack, setSnack] = useState({ open: false, severity: "info", message: "" });
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const searchRef = useRef(null);
  const token = useMemo(() => localStorage.getItem("auth_token") || localStorage.getItem("token"), []);

  const fetch = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const page = opts.page ?? (meta.page || 1);
      const limit = opts.limit ?? (meta.limit || 20);
      const query = {
        page,
        limit,
        sortBy: opts.sortBy ?? sortBy,
        sortOrder: opts.sortOrder ?? sortOrder,
        includeTabs: "true",
      };

      // Map active tab sang query
      if (activeTab && activeTab !== "all") {
        if (activeTab === "paid") {
          query.paymentStatus = "paid";
        } else if (activeTab === "problems") {
          query.paymentStatus = "failed";
        } else {
          // các tab tên trùng với orderStatus
          query.status = activeTab;
        }
      }

      if (q) query.q = q;
      // If a specific date is selected, send it as `date` (backend should accept YYYY-MM-DD)
      if (dateFilter) query.date = dateFilter;

      const res = await getOrdersAdmin(query, token);
      // Nếu backend trả tabs: set dùng tabs; nếu không có, fallback để tính từ res.data
      setOrders(res.data || []);
      setMeta(res.meta || { page, limit, total: 0, pages: 1, totalAmount: 0, pageTotal: 0 });

      if (res.tabs) {
        setTabs(res.tabs);
      } else {
        setTabs(null);
      }
    } catch (err) {
      setSnack({ open: true, severity: "error", message: err?.message || "Lỗi khi tải đơn" });
    } finally {
      setLoading(false);
    }
  }, [activeTab, meta.page, meta.limit, q, sortBy, sortOrder, dateFilter, token]);

  useEffect(() => {
    fetch({ page: 1 });
    // Re-fetch when activeTab, sort options or date filter change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sortBy, sortOrder, dateFilter]);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetch({ page: 1 }), 500);
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
      setSnack({ open: true, severity: "error", message: err?.message || "Cập nhật thất bại" });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    const query = new URLSearchParams({
      export: "csv",
      page: meta.page,
      limit: meta.limit,
      sortBy,
      sortOrder,
    });
    
    if (activeTab !== "all") {
      if (activeTab === "paid") query.append("paymentStatus", "paid");
      else if (activeTab === "problems") query.append("paymentStatus", "failed");
      else query.append("status", activeTab);
    }

    if (q) query.append("q", q);
    if (dateFilter) query.append("date", dateFilter);
    window.open(`/api/admin/orders?${query.toString()}`, "_blank");
  };

  const openDetails = (order) => setSelectedOrder(order);
  const closeDetails = () => setSelectedOrder(null);

  const ROW_HEIGHT = 72;
  const HEADER_HEIGHT = 56;
  const rowsPerPage = meta.limit || 20;
  const tableBodyHeight = ROW_HEIGHT * rowsPerPage;
  const containerHeight = tableBodyHeight + HEADER_HEIGHT;

  const isHighValue = (o) => Number(o.totalAmount ?? o.total ?? 0) >= 1000000;
  const isStaleUnpaid = (o) => {
    const pay = (o.paymentMethod?.status || o.payment?.status || "").toLowerCase();
    if (pay !== "pending") return false;
    if (!o.createdAt) return false;
    const hours = (Date.now() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60);
    return hours >= 48;
  };

  // Lấy số lượng cho tab, ưu tiên dùng tabs từ backend, nếu không có dùng orders hiện tại để tính
  const getTabCount = (tabValue) => {
    if (tabs) {
      // backend trả cấu trúc tabs (ví dụ: all, byStatus, paid, problems, ...)
      switch (tabValue) {
        case "all":
          return tabs.all?.count || 0;
        case "paid":
          return tabs.paid?.count || 0;
        case "problems":
          return tabs.problems?.count || 0;
        case "pending":
          // pending nằm trong byStatus nếu backend trả dạng byStatus
          return tabs.byStatus?.pending?.count ?? tabs.pending?.count ?? 0;
        case "confirmed":
        case "shipped":
        case "delivered":
        case "completed":
        case "cancelled":
          return tabs.byStatus?.[tabValue]?.count || 0;
        default:
          return 0;
      }
    }

    // Fallback: tính từ orders hiện tại
    if (!orders || orders.length === 0) return 0;
    if (tabValue === "all") return meta.total || orders.length;
    if (tabValue === "paid") return orders.filter(o => (o.paymentMethod?.status || o.payment?.status || "").toLowerCase() === "paid").length;
    if (tabValue === "problems") return orders.filter(o => (o.paymentMethod?.status || o.payment?.status || "").toLowerCase() === "failed").length;
    // trạng thái order
    return orders.filter(o => (o.orderStatus || "").toLowerCase() === tabValue).length;
  };

  return (
    <AdminLayout>
      <Box p={3}>  
      {/* Summary cards (stabilized display) */}
        {tabs ? (
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Tổng đơn hàng</Typography>
                  <Typography variant="h4" fontWeight={600}>{tabs.all?.count ?? (meta.total || 0)}</Typography>
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(tabs.all?.totalAmount ?? meta.totalAmount ?? 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Chờ xử lý</Typography>
                  <Typography variant="h4" fontWeight={600} color="warning.main">
                    {getTabCount("pending")}
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    {formatCurrency(getTabCount("pending") ? (tabs?.byStatus?.pending?.totalAmount ?? 0) : 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Có vấn đề</Typography>
                  <Typography variant="h4" fontWeight={600} color="warning.main">
                    {getTabCount("problems")}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          // khi chưa có tabs từ backend vẫn hiển thị basic counts
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Tổng đơn (tạm)</Typography>
                  <Typography variant="h4" fontWeight={600}>{meta.total || orders.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            {TAB_CONFIG.map((tab) => {
              const count = getTabCount(tab.value);
              return (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={
                    <Badge badgeContent={count} color={tab.color || "primary"} max={999} showZero={false}>
                      <Box px={1}>{tab.label}</Box>
                    </Badge>
                  }
                />
              );
            })}
          </Tabs>
        </Paper>

        {/* Filters & Actions */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Tìm kiếm đơn hàng..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

              <TextField
                size="small"
                label="Ngày"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                sx={{ width: 160 }}
                InputLabelProps={{ shrink: true }}
              />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Sắp xếp theo</InputLabel>
              <Select value={sortBy} label="Sắp xếp theo" onChange={(e) => setSortBy(e.target.value)}>
                <MenuItem value="createdAt">Ngày tạo</MenuItem>
                <MenuItem value="totalAmount">Tổng tiền</MenuItem>
                <MenuItem value="orderCode">Mã đơn</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Thứ tự</InputLabel>
              <Select value={sortOrder} label="Thứ tự" onChange={(e) => setSortOrder(e.target.value)}>
                <MenuItem value="desc">Giảm dần</MenuItem>
                <MenuItem value="asc">Tăng dần</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />

            <IconButton onClick={handleExportCSV} title="Xuất CSV" color="primary">
              <FileDownloadIcon />
            </IconButton>

            <IconButton onClick={() => fetch({ page: 1 })} title="Làm mới">
              <RefreshIcon />
            </IconButton>
          </Stack>

          {meta.pageTotal > 0 && (
            <Box mt={2} pt={2} borderTop={1} borderColor="divider">
              <Stack direction="row" spacing={3}>
                <Typography variant="body2">
                  Tổng trang hiện tại: <strong>{formatCurrency(meta.pageTotal)}</strong>
                </Typography>
                <Typography variant="body2">
                  Tổng tất cả: <strong>{formatCurrency(meta.totalAmount)}</strong>
                </Typography>
              </Stack>
            </Box>
          )}
        </Paper>

        {/* Orders Table */}
        <Paper>
          <TableContainer sx={{ height: containerHeight }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ height: HEADER_HEIGHT }}>
                  <TableCell sx={{ fontWeight: 600 }}>Mã đơn</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Khách hàng</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Tổng tiền</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Thanh toán</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngày tạo</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={40} />
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">Không có đơn hàng</Typography>
                    </TableCell>
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
                          bgcolor: high ? "rgba(255, 243, 205, 0.3)" : undefined,
                          borderLeft: stale ? 4 : 0,
                          borderLeftColor: stale ? "error.main" : undefined,
                        }}
                      >
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography fontWeight={600} fontSize={14}>
                              {o.orderCode}
                            </Typography>
                            {high && <Chip label="Giá trị cao" color="warning" size="small" sx={{ width: "fit-content" }} />}
                            {stale && <Chip label="Quá hạn 48h" color="error" size="small" sx={{ width: "fit-content" }} />}
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography fontWeight={500} fontSize={14}>
                              {o.shippingAddress?.fullName ||
                                (o.userId && `${o.userId.firstName || ""} ${o.userId.lastName || ""}`.trim()) ||
                                "-"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {o.shippingAddress?.phone || o.userId?.phone || ""}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {o.shippingAddress?.email || o.userId?.email || ""}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell align="right">
                          <Typography fontWeight={600}>{formatCurrency(o.totalAmount ?? o.total ?? 0)}</Typography>
                        </TableCell>

                        <TableCell>
                          <Chip label={payLabel} color={paymentColor(payStatus)} size="small" />
                        </TableCell>

                        <TableCell>
                          <Select
                            size="small"
                            value={o.orderStatus || "pending"}
                            onChange={(e) => handleStatusChange(o._id || o.id, e.target.value)}
                            disabled={disabled}
                            sx={{ minWidth: 140 }}
                          >
                            {ORDER_STATUS.map((s) => (
                              <MenuItem key={s.key} value={s.key}>
                                {s.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{formatDate(o.createdAt)}</Typography>
                        </TableCell>

                        <TableCell align="center">
                          <IconButton size="small" title="Xem chi tiết" onClick={() => openDetails(o)} color="primary">
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
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </Paper>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} variant="filled">
            {snack.message}
          </Alert>
        </Snackbar>

        <Dialog open={!!selectedOrder} onClose={closeDetails} fullWidth maxWidth="md">
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Chi tiết đơn hàng {selectedOrder?.orderCode}</Typography>
              <Chip label={ORDER_STATUS.find((s) => s.key === selectedOrder?.orderStatus)?.label || "Đang xử lý"} size="small" />
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            {selectedOrder && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Thông tin khách hàng
                    </Typography>
                    <Stack spacing={1}>
                      <Typography>
                        <strong>Họ tên:</strong> {selectedOrder.shippingAddress?.fullName || "-"}
                      </Typography>
                      <Typography>
                        <strong>Điện thoại:</strong> {selectedOrder.shippingAddress?.phone || "-"}
                      </Typography>
                      <Typography>
                        <strong>Email:</strong> {selectedOrder.shippingAddress?.email || "-"}
                      </Typography>
                      <Typography>
                        <strong>Địa chỉ:</strong> {selectedOrder.shippingAddress?.address || "-"}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Thông tin thanh toán
                    </Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography display="inline">
                          <strong>Trạng thái:</strong>{" "}
                        </Typography>
                        <Chip
                          label={paymentLabel(selectedOrder.paymentMethod?.status || selectedOrder.payment?.status)}
                          color={paymentColor(selectedOrder.paymentMethod?.status || selectedOrder.payment?.status)}
                          size="small"
                        />
                      </Box>
                      <Typography>
                        <strong>Phương thức:</strong> {selectedOrder.paymentMethod?.type || "-"}
                      </Typography>
                      <Typography>
                        <strong>Tiền hàng:</strong> {formatCurrency(selectedOrder.subtotal || 0)}
                      </Typography>
                      <Typography>
                        <strong>Phí ship:</strong> {formatCurrency(selectedOrder.shippingFee || 0)}
                      </Typography>
                      <Typography>
                        <strong>Giảm giá:</strong> {formatCurrency(selectedOrder.discount || 0)}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        <strong>Tổng:</strong> {formatCurrency(selectedOrder.totalAmount || 0)}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>

                <Box mt={3}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Sản phẩm
                  </Typography>
                  <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
                    {(selectedOrder.items || []).map((it, idx) => (
                      <ListItem key={idx} divider>
                        <ListItemText
                          primary={
                            <Stack direction="row" justifyContent="space-between">
                              <Typography>
                                {it.name} × {it.quantity}
                              </Typography>
                              <Typography fontWeight={600}>{formatCurrency(it.finalPrice ?? it.price ?? 0)}</Typography>
                            </Stack>
                          }
                          secondary={it.variantId?.color || it.variantId?.sku}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {selectedOrder.customerNote && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Ghi chú
                    </Typography>
                    <Typography color="text.secondary">{selectedOrder.customerNote}</Typography>
                  </Box>
                )}
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