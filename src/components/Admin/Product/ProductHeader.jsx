import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Add } from "@mui/icons-material";
import ProductDrawer from "./ProductDrawer";

const ProductHeader = ({ onAddSuccess }) => {
  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" fontWeight="bold">
          Quản lý sản phẩm
        </Typography>

        <Button
          variant="contained"
          color="success"
          startIcon={<Add />}
          onClick={() => setOpenDrawer(true)}
        >
          Thêm sản phẩm
        </Button>
      </Box>

      <ProductDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        onSuccess={onAddSuccess}
      />
    </>
  );
};

export default ProductHeader;
