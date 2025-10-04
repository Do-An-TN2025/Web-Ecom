"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  Box,
  IconButton,
  Grid,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import VariantList from "./variants/VariantList";
import VariantForm from "./variants/VariantForm";
import { addSizeToVariant, createVariant, deleteProduct} from "../../../services/productService";
import { updateVariant } from "../../../services/variantService";

export default function VariantDialog({ open, onClose, product, token, onSuccess }) {
  const [variants, setVariants] = useState(product?.variants || []);
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddVariant = async (variantData) => {
  setLoading(true);
  try {
    const { color, colorCode, images, sizes, imageFiles } = variantData;
    
    // Tạo FormData
    const formData = new FormData();
    
    if (editingVariant) {
      // UPDATE VARIANT
      formData.append('color', color);
      formData.append('colorCode', colorCode);
      formData.append('status', formData.status || 'in_stock');
      formData.append('sizes', JSON.stringify(sizes));
      
      // Append existing images (nếu có)
      if (images && images.length > 0) {
        formData.append('images', JSON.stringify(images));
      }
      
      // Append new image files
      if (imageFiles && imageFiles.length > 0) {
        imageFiles.forEach(file => {
          formData.append('images', file); // Field name phải là 'images'
        });
      }

      console.log('Updating variant with data:', {
        variantId: editingVariant._id,
        color,
        colorCode,
        sizesCount: sizes.length,
        imagesCount: images.length,
        newImageFilesCount: imageFiles.length
      });

      const response = await updateVariant(editingVariant._id, formData, token);
      
      // Cập nhật local state
      setVariants(variants.map(v => 
        v._id === editingVariant._id ? response.variant : v
      ));
      
      showMessage('Cập nhật biến thể thành công!');
      
    } else {
      // CREATE NEW VARIANT (giữ nguyên logic cũ)
      formData.append('productId', product._id);
      formData.append('color', color);
      formData.append('colorCode', colorCode);
      formData.append('sizes', JSON.stringify(sizes));
      
      if (imageFiles && imageFiles.length > 0) {
        imageFiles.forEach(file => {
          formData.append('images', file);
        });
      }

      const response = await createVariant(formData, token);
      setVariants([...variants, response.variant]);
      showMessage('Tạo biến thể mới thành công!');
    }
    
    setShowForm(false);
    setEditingVariant(null);
    
    if (onSuccess) onSuccess();
    
  } catch (error) {
    console.error('Error saving variant:', error);
    showMessage('Lỗi: ' + error.message, 'error');
  } finally {
    setLoading(false);
  }
};

  const handleEdit = (variant) => {
    setEditingVariant(variant);
    setShowForm(true);
  };

  const handleDelete = async (variantId) => {
    if (!window.confirm('Bạn có chắc muốn xóa biến thể này?')) return;
    
    try {
      await deleteProduct(variantId, token);
      setVariants(variants.filter(v => v._id !== variantId));
      showMessage('Xóa biến thể thành công!');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error deleting variant:', error);
      showMessage('Lỗi khi xóa: ' + error.message, 'error');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        fullWidth 
        maxWidth="lg"
        PaperProps={{
          sx: { borderRadius: 3, minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Quản lý biến thể
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {product?.name || "Tên sản phẩm"}
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          {!showForm ? (
            <VariantList
              variants={variants}
              onAddVariant={() => {
                setEditingVariant(null);
                setShowForm(true);
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <VariantForm
              variant={editingVariant}
              onSave={handleAddVariant}
              onCancel={() => {
                setShowForm(false);
                setEditingVariant(null);
              }}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}