import { Card, TextField, Typography, Box, Chip, FormControl, InputLabel, Select, MenuItem, InputAdornment } from "@mui/material";
import { ColorLens as ColorLensIcon } from "@mui/icons-material";

const COLOR_MAPPING = {
  'đỏ': '#FF0000', 'red': '#FF0000',
  'xanh lá': '#00FF00', 'green': '#00FF00',
  'xanh dương': '#0000FF', 'blue': '#0000FF',
  'vàng': '#FFFF00', 'yellow': '#FFFF00',
  'cam': '#FFA500', 'orange': '#FFA500',
  'hồng': '#FFC0CB', 'pink': '#FFC0CB',
  'tím': '#800080', 'purple': '#800080',
  'nâu': '#A52A2A', 'brown': '#A52A2A',
  'đen': '#000000', 'black': '#000000',
  'trắng': '#FFFFFF', 'white': '#FFFFFF',
  'xám': '#808080', 'gray': '#808080',
  'xanh navy': '#000080', 'navy': '#000080',
};

export default function ColorInfoForm({ formData, onChange }) {
  const handleInputChange = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const handleColorNameChange = (value) => {
    handleInputChange('color', value);
    const hex = COLOR_MAPPING[value.toLowerCase()];
    if (hex && !formData.colorCode) {
      handleInputChange('colorCode', hex);
    }
  };

  return (
    <Card sx={{ p: 3, mb: 2 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Thông tin màu sắc
      </Typography>
      
      <TextField
        label="Tên màu *"
        value={formData.color}
        onChange={(e) => handleColorNameChange(e.target.value)}
        fullWidth
        margin="normal"
        placeholder="VD: Đen, Trắng, Xanh navy..."
      />
      
      <TextField
        label="Mã màu (Hex)"
        value={formData.colorCode}
        onChange={(e) => handleInputChange('colorCode', e.target.value)}
        fullWidth
        margin="normal"
        placeholder="#FF0000"
        InputProps={{
          startAdornment: formData.colorCode ? (
            <InputAdornment position="start">
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: formData.colorCode,
                  border: '1px solid #ddd'
                }}
              />
            </InputAdornment>
          ) : (
            <InputAdornment position="start">
              <ColorLensIcon color="disabled" />
            </InputAdornment>
          ),
        }}
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Trạng thái</InputLabel>
        <Select
          value={formData.status}
          label="Trạng thái"
          onChange={(e) => handleInputChange('status', e.target.value)}
        >
          <MenuItem value="in_stock">Còn hàng</MenuItem>
          <MenuItem value="out_of_stock">Hết hàng</MenuItem>
          <MenuItem value="coming_soon">Sắp có hàng</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
          Màu phổ biến:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {Object.entries(COLOR_MAPPING).slice(0, 6).map(([name, hex]) => (
            <Chip
              key={name}
              label={name}
              size="small"
              onClick={() => {
                handleColorNameChange(name);
                handleInputChange('colorCode', hex);
              }}
              sx={{
                cursor: 'pointer',
                '&:hover': { opacity: 0.8 }
              }}
            />
          ))}
        </Box>
      </Box>
    </Card>
  );
}