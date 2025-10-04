import {
  Card,
  Typography,
  Box,
  Button,
  Grid,
  Divider,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import SizeItem from "./SizeItem";

export default function SizeManagementForm({ sizes, onSizesChange }) {
  const handleAddSize = () => {
    const newSize = { 
      size: "", 
      sku: "", 
      stock: 0, 
      price: 0, 
      originalPrice: 0,
      discountPrice: 0,
      discountPercent: 0,
      onSale: false,
      saleNote: "",
      isDefault: false 
    };
    
    console.log('Adding new size:', newSize);
    onSizesChange([...sizes, newSize]);
  };

  const handleSizeChange = (index, field, value) => {
    console.log(`Changing size ${index}, field ${field} to:`, value);
    
    const newSizes = sizes.map((size, i) => {
      if (i === index) {
        const updatedSize = { ...size, [field]: value };
        
        // Auto-calculate discount
        if (field === 'originalPrice' && updatedSize.discountPrice > 0) {
          const discountPercent = Math.round((1 - updatedSize.discountPrice / value) * 100);
          updatedSize.discountPercent = discountPercent;
        }
        if (field === 'discountPrice' && updatedSize.originalPrice > 0) {
          const discountPercent = Math.round((1 - value / updatedSize.originalPrice) * 100);
          updatedSize.discountPercent = discountPercent;
        }
        if (field === 'discountPercent' && updatedSize.originalPrice > 0) {
          const discountPrice = updatedSize.originalPrice * (1 - value / 100);
          updatedSize.discountPrice = Math.round(discountPrice);
        }
        
        return updatedSize;
      }
      return size;
    });
    
    onSizesChange(newSizes);
  };

  const handleRemoveSize = (index) => {
    if (sizes.length > 1) {
      console.log('Removing size at index:', index);
      const newSizes = sizes.filter((_, i) => i !== index);
      onSizesChange(newSizes);
    }
  };

  const handleSetDefault = (index) => {
    console.log('Setting default size at index:', index);
    const newSizes = sizes.map((size, i) => ({
      ...size,
      isDefault: i === index
    }));
    onSizesChange(newSizes);
  };

  console.log('Current sizes:', sizes);

  return (
    <Card sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" fontWeight="bold">
          Danh sách size * ({sizes.length} size)
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddSize}
        >
          Thêm size
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 500, overflowY: 'auto' }}>
        {sizes.map((size, index) => (
          <SizeItem
            key={index}
            index={index}
            size={size}
            onChange={handleSizeChange}
            onRemove={handleRemoveSize}
            onSetDefault={handleSetDefault}
            isLast={sizes.length === 1}
          />
        ))}
      </Box>

      {/* Debug info */}
      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Debug: {sizes.length} sizes, first size: {JSON.stringify(sizes[0])}
        </Typography>
      </Box>
    </Card>
  );
}