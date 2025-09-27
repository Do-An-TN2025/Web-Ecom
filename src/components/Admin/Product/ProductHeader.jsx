// components/Admin/Product/ProductHeader.jsx
import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Stack,
  InputAdornment,
} from "@mui/material";
import { Search, Add } from "@mui/icons-material";

const ProductHeader = ({ onSearch, onAdd }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  const handleSearch = () => {
    onSearch({ search, status, category });
  };

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", md: "center" }}
      gap={2}
      mb={3}
    >
      {/* Search Box */}
      <Stack direction="row" spacing={2} flex={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          sx={{ whiteSpace: "nowrap" }}
        >
          Tìm
        </Button>
      </Stack>

      {/* Filters + Add */}
      <Stack direction="row" spacing={2}>
        <TextField
          select
          size="small"
          label="Trạng thái"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="active">Đang bán</MenuItem>
          <MenuItem value="hidden">Ẩn</MenuItem>
          <MenuItem value="out_of_stock">Hết hàng</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Danh mục"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="polo">Áo Polo</MenuItem>
          <MenuItem value="tshirt">Áo Thun</MenuItem>
          <MenuItem value="jeans">Quần Jeans</MenuItem>
        </TextField>

        <Button
          variant="contained"
          color="success"
          startIcon={<Add />}
          onClick={onAdd}
        >
          Thêm sản phẩm
        </Button>
      </Stack>
    </Box>
  );
};

export default ProductHeader;
