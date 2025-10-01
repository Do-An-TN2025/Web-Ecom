import React, { useEffect, useState } from "react";
import AdminLayout from "../../../components/Admin/AdminLayout";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../services/categoriesServices";

import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
} from "@mui/material";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", slug: "", path: "" });
  const [editing, setEditing] = useState(null); // id đang sửa
  const [open, setOpen] = useState(false);

  const token = localStorage.getItem("token");

  // Load danh sách categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Lỗi khi tải danh mục:", err);
      alert("Không thể tải danh sách danh mục!");
    }
    setLoading(false);
  };

  // Mở form thêm / sửa
  const handleOpen = (category = null) => {
    if (category) {
      setForm({ name: category.name, slug: category.slug, path: category.path });
      setEditing(category._id);
    } else {
      setForm({ name: "", slug: "", path: "" });
      setEditing(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setForm({ name: "", slug: "", path: "" });
    setEditing(null);
    setOpen(false);
  };

  // Lưu (tạo mới hoặc cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCategory(editing, form, token);
        alert("Cập nhật danh mục thành công!");
      } else {
        await createCategory(form, token);
        alert("Thêm danh mục thành công!");
      }
      handleClose();
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi lưu danh mục!");
    }
  };

  // Xóa danh mục
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa danh mục này?")) {
      try {
        await deleteCategory(id, token);
        alert("Xóa danh mục thành công!");
        fetchCategories();
      } catch (err) {
        console.error(err);
        alert("Không thể xóa danh mục!");
      }
    }
  };

  // Cột của DataGrid
  const columns = [
    {
      field: "stt",
      headerName: "STT",
      width: 80,
      renderCell: (params) =>
        params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    { field: "name", headerName: "Tên danh mục", flex: 1 },
    { field: "slug", headerName: "Slug", flex: 1 },
    { field: "path", headerName: "Đường dẫn", flex: 1 },
    {
      field: "actions",
      headerName: "Hành động",
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleOpen(params.row)}
          >
            Sửa
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDelete(params.row._id)}
          >
            Xóa
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <AdminLayout>
      {/* Tiêu đề + nút thêm */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Quản lý danh mục
        </Typography>
        <Button variant="contained" onClick={() => handleOpen()}>
          + Thêm danh mục
        </Button>
      </Box>

      {/* Bảng danh mục */}
      <div style={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={categories}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          getRowId={(row) => row._id}
          loading={loading}
        />
      </div>

      {/* Form dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {editing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} id="category-form">
            <TextField
              margin="dense"
              label="Tên danh mục"
              name="name"
              fullWidth
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Slug"
              name="slug"
              fullWidth
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Đường dẫn"
              name="path"
              fullWidth
              value={form.path}
              onChange={(e) => setForm({ ...form, path: e.target.value })}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button
            type="submit"
            form="category-form"
            variant="contained"
            color="primary"
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;
