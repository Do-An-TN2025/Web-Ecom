import { Card, CardContent, Typography, Box, IconButton, Chip } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

const getStatusColor = (status) => {
  switch (status) {
    case 'in_stock': return 'success';
    case 'out_of_stock': return 'error';
    case 'coming_soon': return 'warning';
    default: return 'default';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'in_stock': return 'Còn hàng';
    case 'out_of_stock': return 'Hết hàng';
    case 'coming_soon': return 'Sắp có hàng';
    default: return status;
  }
};

export default function VariantCard({ variant, onEdit, onDelete }) {
  const getTotalStock = (variant) => {
    return variant.sizes?.reduce((acc, s) => acc + (s.stock || 0), 0) || 0;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <Box
        sx={{
          height: 160,
          bgcolor: variant.colorCode || 'grey.100',
          backgroundImage: variant.images?.[0] 
            ? `url(${variant.images[0]})` 
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 0.5
          }}
        >
          <Chip
            label={getStatusText(variant.status)}
            size="small"
            color={getStatusColor(variant.status)}
            sx={{ fontWeight: 'bold' }}
          />
          <IconButton
            size="small"
            onClick={onEdit}
            sx={{
              bgcolor: 'white',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={onDelete}
            sx={{
              bgcolor: 'white',
              color: 'error.main',
              '&:hover': { bgcolor: 'error.50' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: variant.colorCode,
              border: '1px solid #ddd'
            }}
          />
          <Typography variant="h6" fontWeight="bold">
            {variant.color}
          </Typography>
          {variant.colorCode && (
            <Typography variant="caption" color="text.secondary">
              ({variant.colorCode})
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {variant.sizes?.map((s, i) => (
            <Chip
              key={i}
              label={`${s.size} - ${s.stock}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Số size
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {variant.sizes?.length || 0}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Tồn kho
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {getTotalStock(variant)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Ảnh
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {variant.images?.length || 0}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}