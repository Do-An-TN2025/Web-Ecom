import { useEffect, useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  Divider,
  CircularProgress,
} from "@mui/material";
import ColorInfoForm from "./ColorInfoForm";
import ImageUploadForm from "./ImageUploadForm";
import SizeManagementForm from "./SizeManagementForm";

export default function VariantForm({ variant, onSave, onCancel, loading }) {

    const handleReorderImages = (fromIndex, toIndex) => {
    const newImages = [...formData.images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

const [formData, setFormData] = useState(() => {
  // Đảm bảo initial state luôn đúng
  const initialImages = Array.isArray(variant?.images) ? variant.images : [];
 const initialSizes = Array.isArray(variant?.sizes) && variant.sizes.length > 0 
    ? variant.sizes 
    : [{ 
        size: "", 
        sku: "", 
        stock: 0, 
        price: 0, 
        originalPrice: 0,
        discountPrice: 0,
        discountPercent: 0,
        onSale: false,
        saleNote: "",
        isDefault: true 
      }];

  console.log('Initializing VariantForm with:', {
    variant,
    initialImages,
    initialSizes
  });

  return {
    color: variant?.color || "",
    colorCode: variant?.colorCode || "",
    status: variant?.status || "in_stock",
    images: initialImages,
    sizes: initialSizes
  };
});

  useEffect(() => {
  console.log('Current formData.images:', formData.images);
}, [formData.images]);

  const [imageFiles, setImageFiles] = useState([]);

  const handleSave = () => {
    if (!formData.color.trim()) {
      alert('Vui lòng nhập màu sắc!');
      return;
    }

    if (formData.sizes.some(s => !s.size.trim())) {
      alert('Vui lòng nhập đầy đủ thông tin size!');
      return;
    }

    onSave({
      ...formData,
      imageFiles
    });
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {variant ? 'Chỉnh sửa biến thể' : 'Thêm biến thể mới'}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Left Column */}
        <Grid item xs={12} md={5}>
          <ColorInfoForm
            formData={formData}
            onChange={setFormData}
          />
          <ImageUploadForm
            images={formData.images}
            onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
            onImageFilesChange={setImageFiles}
            onReorderImages={handleReorderImages}
          />
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={7}>
          <SizeManagementForm
            sizes={formData.sizes}
            onSizesChange={(sizes) => setFormData(prev => ({ ...prev, sizes }))}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          size="large"
          sx={{ px: 4 }}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          size="large"
          sx={{ px: 4 }}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Đang lưu...' : (variant ? 'Cập nhật' : 'Thêm biến thể')}
        </Button>
      </Box>
    </Box>
  );
}