import React, { useEffect, useState, useCallback } from "react";
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
  CircularProgress,
  Stack,
} from "@mui/material";

import { toast } from 'react-toastify';

const emptyForm = { name: "", slug: "", path: "" };

const slugify = (str) =>
  str
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [originalSlug, setOriginalSlug] = useState(null); // slug gốc để update/delete
  // const [editingId, setEditingId] = useState(null);  // bỏ dùng _id cho update
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem("token");

  const loadCategories = useCallback(async () => {
    setFetching(true);
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load categories error:", err);
      alert(err.message || "Không thể tải danh mục!");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpen = (category = null) => {
    if (category) {
      setForm({
        name: category.name || "",
        slug: category.slug || "",
        path: category.path || "",
      });
      setEditing(true);
      setOriginalSlug(category.slug); // chỉ dùng slug
    } else {
      setForm(emptyForm);
      setEditing(false);
      setOriginalSlug(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    if (saving) return;
    setForm(emptyForm);
    setEditing(false);
    setOriginalSlug(null);
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Tự sinh slug nếu user đang sửa name và slug chưa chỉnh tay
    if (name === "name") {
      setForm((prev) => ({
        ...prev,
        name: value,
        slug:
          prev.slug.trim() === "" || prev.slug === slugify(prev.name)
            ? slugify(value)
            : prev.slug,
      }));
    } else if (name === "slug") {
      setForm((prev) => ({ ...prev, slug: slugify(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      alert("Tên và slug là bắt buộc.");
      return;
    }
    setSaving(true);
    console.log("Submitting:", {
      mode: editing ? "update" : "create",
      originalSlug,
      form,
    });
    try {
      if (editing) {
        // dùng slug gốc trên URL, body mang slug mới (nếu đổi)
        await updateCategory(originalSlug, form, token);
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await createCategory(form, token);
        toast.success("Thêm danh mục thành công!");
      }
      handleClose();
      loadCategories();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message || "Có lỗi xảy ra khi lưu danh mục!");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!slug) return;
    if (!window.confirm("Bạn chắc chắn muốn xóa danh mục này?")) return;
    try {
      await deleteCategory(slug, token);
      toast.success("Xóa danh mục thành công!");
      loadCategories();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message || "Không thể xóa danh mục!");
    }
  };

  const columns = [
    {
      field: "stt",
      headerName: "STT",
      width: 80,
      sortable: false,
      renderCell: (params) =>
        params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    { field: "name", headerName: "Tên danh mục", flex: 1, minWidth: 180 },
    { field: "slug", headerName: "Slug", flex: 1, minWidth: 160 },
    { field: "path", headerName: "Đường dẫn", flex: 1, minWidth: 160 },
    {
      field: "actions",
      headerName: "Hành động",
      sortable: false,
      width: 180,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
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
            onClick={() => handleDelete(params.row.slug)}
          >
            Xóa
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Quản lý danh mục
        </Typography>
        <Button variant="contained" onClick={() => handleOpen()}>
          + Thêm danh mục
        </Button>
      </Box>

      <Box sx={{ height: 520, width: "100%", position: "relative" }}>
        <DataGrid
          rows={categories}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          // getRowId vẫn có thể dùng _id cho key hiển thị, không ảnh hưởng update
          getRowId={(row) => row._id || row.slug}
          loading={fetching}
          disableSelectionOnClick
        />
        {fetching && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              bgcolor: "rgba(255,255,255,0.5)",
              zIndex: 2,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {editing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
        </DialogTitle>
        <DialogContent dividers>
          <form id="category-form" onSubmit={handleSubmit}>
            <TextField
              margin="dense"
              label="Tên danh mục"
              name="name"
              fullWidth
              required
              value={form.name}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              label="Slug"
              name="slug"
              fullWidth
              required
              value={form.slug}
              onChange={handleChange}
              helperText="Có thể chỉnh; tự sinh dựa trên Tên."
            />
            <TextField
              margin="dense"
              label="Đường dẫn"
              name="path"
              fullWidth
              value={form.path}
              onChange={handleChange}
              placeholder="/san-pham/..."
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="category-form"
            variant="contained"
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;