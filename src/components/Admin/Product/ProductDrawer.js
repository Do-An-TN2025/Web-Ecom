import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  MenuItem,
} from "@mui/material";
import { getCategories } from "../../../services/categoryService";
import axios from "axios";

import { toast } from 'react-toastify';

const defaultForm = {
  name: "",
  slug: "",
  shortDescription: "",
  brand: "",
  tags: "",
  categoryId: "",
};


const ProductDrawer = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState(defaultForm);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (open) {
      getCategories().then((data) => setCategories(data));
    }
  }, [open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm(defaultForm);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("auth_token");

      await axios.post(
        `${process.env.REACT_APP_API_URL}/products/add-product`,
        {
          ...form,
          tags: form.tags
            ? form.tags.split(",").map((t) => t.trim())
            : [],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      resetForm();        // ✅ Clear form
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("❌ Lỗi tạo sản phẩm:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Không thể tạo sản phẩm!");
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Typography variant="h6" mb={2}>
          Thêm sản phẩm mới
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Tên sản phẩm"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Slug"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Mô tả ngắn"
            name="shortDescription"
            value={form.shortDescription}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Thương hiệu"
            name="brand"
            value={form.brand}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Tags (cách nhau bởi dấu ,)"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            select
            label="Danh mục"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            fullWidth
          >
            {categories.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              onClick={() => {
                resetForm(); 
                onClose();
              }}
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmit}
            >
              Lưu
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default ProductDrawer;
