import React, { useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Typography,
  Stack,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Badge,
  AvatarGroup,
} from "@mui/material";
import {
  Edit,
  Delete,
  Search,
  FilterList,
  Visibility,
  MoreVert,
  LocalOffer,
  Inventory,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";

const ProductTable = ({ products, onEdit, onDelete, onView }) => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [anchorEl, setAnchorEl] = useState(null);

  if (!products || products.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 8,
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: 3,
        }}
      >
        <Inventory sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Chưa có sản phẩm nào
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Hãy thêm sản phẩm đầu tiên của bạn
        </Typography>
      </Paper>
    );
  }

  // Định nghĩa cột
  const columns = [
    {
      field: "image",
      headerName: "Sản phẩm",
      width: 320,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
          <Badge
            badgeContent={params.row.variants}
            color="primary"
            overlap="circular"
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
          >
            <Avatar
              src={params.value}
              variant="rounded"
              sx={{
                width: 64,
                height: 64,
                border: "2px solid #f0f0f0",
                boxShadow: 1,
              }}
            />
          </Badge>
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight="600"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {params.row.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={params.row.brand}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
              <Typography variant="caption" color="text.secondary">
                SKU: {params.row.slug?.substring(0, 12)}...
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      ),
    },
    {
      field: "shortDescription",
      headerName: "Mô tả",
      width: 250,
      renderCell: (params) => (
        <Tooltip title={params.value || "Chưa có mô tả"} arrow>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.4,
            }}
          >
            {params.value || "Chưa có mô tả"}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "price",
      headerName: "Giá bán",
      width: 140,
      renderCell: (params) => (
        <Stack spacing={0.3}>
          <Typography variant="body2" fontWeight="700" color="primary">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(params.value)}
          </Typography>
          {params.row.priceRange && (
            <Typography variant="caption" color="text.secondary">
              {params.row.priceRange}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: "stock",
      headerName: "Tồn kho",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const stockLevel =
          params.value > 50 ? "high" : params.value > 10 ? "medium" : "low";
        const stockConfig = {
          high: { color: "success", icon: <TrendingUp fontSize="small" /> },
          medium: { color: "warning", icon: <TrendingDown fontSize="small" /> },
          low: { color: "error", icon: <TrendingDown fontSize="small" /> },
        };

        return (
          <Stack spacing={0.5} alignItems="center">
            <Chip
              icon={stockConfig[stockLevel].icon}
              label={params.value}
              size="small"
              color={stockConfig[stockLevel].color}
              sx={{ fontWeight: "bold", minWidth: 70 }}
            />
            <Typography variant="caption" color="text.secondary">
              {params.row.variants} biến thể
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: "rating",
      headerName: "Đánh giá",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Stack spacing={0.3} alignItems="center">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2" fontWeight="700" color="#ff9800">
              ★ {params.row.ratingAverage.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              /5
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            ({params.row.ratingCount} đánh giá)
          </Typography>
        </Stack>
      ),
    },
    {
      field: "tags",
      headerName: "Tags",
      width: 200,
      renderCell: (params) => {
        const tags = params.value || [];
        const displayTags = tags.slice(0, 3);
        const remainingCount = tags.length - 3;

        return (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ flexWrap: "wrap", gap: 0.5 }}
          >
            {displayTags.map((tag, index) => (
              <Chip
                key={index}
                icon={<LocalOffer sx={{ fontSize: 14 }} />}
                label={tag}
                size="small"
                color={
                  tag === "hot"
                    ? "error"
                    : tag === "new"
                    ? "success"
                    : "default"
                }
                sx={{ fontSize: "0.7rem", height: 22 }}
              />
            ))}
            {remainingCount > 0 && (
              <Chip
                label={`+${remainingCount}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.7rem", height: 22 }}
              />
            )}
          </Stack>
        );
      },
    },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const statusMap = {
          active: { label: "Đang bán", color: "success" },
          hidden: { label: "Đã ẩn", color: "warning" },
          out_of_stock: { label: "Hết hàng", color: "error" },
        };
        const status = statusMap[params.value] || {
          label: params.value,
          color: "default",
        };
        return (
          <Chip
            label={status.label}
            color={status.color}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Ngày tạo",
      width: 120,
      renderCell: (params) => (
        <Stack spacing={0.3}>
          <Typography variant="caption" fontWeight="600">
            {new Date(params.value).toLocaleDateString("vi-VN")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(params.value).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 140,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Xem chi tiết" arrow>
            <IconButton
              size="small"
              sx={{
                color: "#2196f3",
                "&:hover": { backgroundColor: "#e3f2fd" },
              }}
              onClick={() => onView?.(params.row.productData)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Chỉnh sửa" arrow>
            <IconButton
              size="small"
              sx={{
                color: "#ff9800",
                "&:hover": { backgroundColor: "#fff3e0" },
              }}
              onClick={() => onEdit(params.row.productData)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa" arrow>
            <IconButton
              size="small"
              sx={{
                color: "#f44336",
                "&:hover": { backgroundColor: "#ffebee" },
              }}
              onClick={() => onDelete(params.row.productData)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // Chuẩn bị dữ liệu cho DataGrid
  const rows = products.map((product) => {
    // Tính tổng tồn kho từ tất cả variants và sizes
    const totalStock =
      product.variants?.reduce((total, variant) => {
        const variantStock =
          variant.sizes?.reduce((acc, size) => acc + (size.stock || 0), 0) ||
          0;
        return total + variantStock;
      }, 0) || 0;

    // Lấy giá từ defaultVariant hoặc variant đầu tiên
    const defaultVariant = product.defaultVariant || product.variants?.[0];
    const price = defaultVariant?.sizes?.[0]?.price || 0;

    // Tính price range nếu có nhiều sizes
    let priceRange = "";
    if (defaultVariant?.sizes?.length > 1) {
      const prices = defaultVariant.sizes.map((s) => s.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      if (minPrice !== maxPrice) {
        priceRange = `${new Intl.NumberFormat("vi-VN").format(
          minPrice
        )}đ - ${new Intl.NumberFormat("vi-VN").format(maxPrice)}đ`;
      }
    }

    return {
      id: product._id,
      image: defaultVariant?.images?.[0] || "",
      name: product.name,
      brand: product.brand || "N/A",
      slug: product.slug || "",
      shortDescription: product.shortDescription || "",
      variants: product.variantsCount || product.variants?.length || 0,
      price: price,
      priceRange: priceRange,
      stock: totalStock,
      ratingAverage: product.rating?.average || 0,
      ratingCount: product.rating?.count || 0,
      tags: product.tags || [],
      status: product.status || "active",
      createdAt: product.createdAt,
      // Lưu reference để dùng trong edit/delete
      productData: product,
    };
  });

  // Filter logic
  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.name.toLowerCase().includes(searchText.toLowerCase()) ||
      row.brand.toLowerCase().includes(searchText.toLowerCase()) ||
      row.slug.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || row.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* DataGrid */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          overflow: "hidden",
          height: "calc(100vh - 280px)", // Điều chỉnh theo header + padding
        }}
      >
        <DataGrid
          rows={filteredRows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          disableRowSelectionOnClick
          rowHeight={90}
          checkboxSelection
          sx={{
            border: "none",
            height: "100%",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f8f9fa",
              fontWeight: "700",
              fontSize: "0.85rem",
              borderBottom: "2px solid #e0e0e0",
              color: "#333",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #f5f5f5",
              py: 1,
            },
            "& .MuiDataGrid-row": {
              "&:hover": {
                backgroundColor: "#f8f9fa",
                cursor: "pointer",
              },
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "2px solid #e0e0e0",
              backgroundColor: "#fafafa",
            },
            "& .MuiCheckbox-root": {
              color: "#bdbdbd",
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default ProductTable;