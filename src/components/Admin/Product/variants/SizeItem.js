import {
  Card,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Grid,
  Divider,
  InputAdornment,
  Box,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

export default function SizeItem({ index, size, onChange, onRemove, onSetDefault, isLast }) {

  const onlyDigits = (str) => str.replace(/\D/g, "");
  const formatThousand = (num) =>
    num === 0
      ? "0"
      : num
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const parseInputNumber = (val) => {
    const digits = onlyDigits(val);
    return digits ? parseInt(digits, 10) : 0;
  };

  const handleFieldChange = (field, value) => {
    console.log(`Size ${index} - ${field}:`, value);
    onChange(index, field, value);
  };

  const handleNumericChange = (field, displayValue) => {
    const numeric = parseInputNumber(displayValue);
    handleFieldChange(field, numeric);
  };

  const handleDefaultChange = (checked) => {
    if (checked) {
      onSetDefault(index);
    }
  };

  return (
    <Card variant="outlined" sx={{ p: 2, border: '2px solid', borderColor: size.isDefault ? 'primary.main' : 'grey.300' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Size #{index + 1} {size.isDefault && "(Mặc định)"}
        </Typography>
        <IconButton
          onClick={() => onRemove(index)}
          color="error"
          disabled={isLast}
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      <Grid container spacing={2} alignItems="start">
        {/* Size */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            label="Size *"
            value={size.size || ""}
            onChange={(e) => handleFieldChange('size', e.target.value)}
            fullWidth
            size="small"
            placeholder="M, L, XL..."
            error={!size.size}
            helperText={!size.size ? "Bắt buộc" : ""}
          />
        </Grid>

        {/* SKU */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            label="SKU"
            value={size.sku || ""}
            onChange={(e) => handleFieldChange('sku', e.target.value)}
            fullWidth
            size="small"
            placeholder="Mã SKU"
          />
        </Grid>

        {/* Stock (formatted) */}
        <Grid item xs={6} sm={4} md={2}>
          <TextField
            label="Tồn kho"
            value={formatThousand(size.stock || 0)}
            onChange={(e) => handleNumericChange("stock", e.target.value)}
            fullWidth
            size="small"
            inputMode="numeric"
            placeholder="0"
          />
        </Grid>

        {/* Price (formatted) */}
        <Grid item xs={6} sm={4} md={2}>
          <TextField
            label="Giá bán"
            value={formatThousand(size.price || 0)}
            onChange={(e) => handleNumericChange("price", e.target.value)}
            fullWidth
            size="small"
            inputMode="numeric"
            placeholder="0"
            InputProps={{
              endAdornment: <InputAdornment position="end">₫</InputAdornment>,
            }}
          />
        </Grid>

        {/* Sale Settings */}
        <Grid item xs={12} sm={4} md={2}>
          <FormControlLabel
            control={
              <Switch
                checked={size.onSale || false}
                onChange={(e) => handleFieldChange('onSale', e.target.checked)}
                size="small"
              />
            }
            label="Khuyến mãi"
          />
        </Grid>

        {/* Default Size */}
        <Grid item xs={12} sm={4} md={2}>
          <FormControlLabel
            control={
              <Switch
                checked={size.isDefault || false}
                onChange={(e) => handleDefaultChange(e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label="Mặc định"
          />
        </Grid>

        {/* Sale Details - Expanded when onSale */}
        {size.onSale && (
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              Thông tin khuyến mãi
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Giá gốc"
                  value={formatThousand(size.originalPrice || size.price || 0)}
                  onChange={(e) => handleNumericChange("originalPrice", e.target.value)}
                  fullWidth
                  size="small"
                  inputMode="numeric"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Giá khuyến mãi"
                  value={formatThousand(size.discountPrice || 0)}
                  onChange={(e) => handleNumericChange("discountPrice", e.target.value)}
                  fullWidth
                  size="small"
                  inputMode="numeric"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Giảm giá %"
                  type="number"
                  value={size.discountPercent || 0}
                  onChange={(e) =>
                    handleFieldChange(
                      "discountPercent",
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Ghi chú khuyến mãi"
                  value={size.saleNote || ""}
                  onChange={(e) => handleFieldChange('saleNote', e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="VD: Giảm sốc, Flash sale..."
                />
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Card>
  );
}