import { Button, Typography, Box, Grid } from "@mui/material";
import { Add as AddIcon, Image as ImageIcon } from "@mui/icons-material";
import VariantCard from "./VariantCard";

export default function VariantList({ variants, onAddVariant, onEdit, onDelete }) {
  if (variants.length === 0) {
    return (
      <>
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'grey.300'
          }}
        >
          <ImageIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography color="text.secondary" variant="h6">
            Chưa có biến thể nào
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
            Thêm biến thể đầu tiên cho sản phẩm của bạn
          </Typography>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={onAddVariant}
            sx={{ 
              borderRadius: 2,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            Thêm biến thể mới
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        {variants.map((variant) => (
          <Grid item xs={12} sm={6} md={4} key={variant._id}>
            <VariantCard
              variant={variant}
              onEdit={() => onEdit(variant)}
              onDelete={() => onDelete(variant._id)}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={onAddVariant}
          sx={{ 
            borderRadius: 2,
            px: 4,
            py: 1.5,
            textTransform: 'none',
            fontSize: '1rem'
          }}
        >
          Thêm biến thể mới
        </Button>
      </Box>
    </>
  );
}