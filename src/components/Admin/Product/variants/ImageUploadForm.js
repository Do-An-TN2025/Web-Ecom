import { useState, useRef } from "react";
import {
  Card,
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  Chip,
  Divider,
  Grid,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Image as ImageIcon,
} from "@mui/icons-material";

export default function ImageUploadForm({ images, onImagesChange, onImageFilesChange }) {
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef(null);

  // Đảm bảo images luôn là array
  const safeImages = Array.isArray(images) ? images : [];

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    
    console.log('Files selected:', files);
    
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    console.log('File array length:', fileArray.length);

    // Cập nhật imageFiles
    const currentFiles = Array.isArray(onImageFilesChange) ? onImageFilesChange : [];
    const newFiles = [...currentFiles, ...fileArray];
    onImageFilesChange(newFiles);

    // Tạo preview URLs cho tất cả files
    const processFile = (file) => {
      return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
          console.warn('File không phải là ảnh:', file.name);
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('File loaded successfully:', file.name);
          resolve(e.target.result);
        };
        
        reader.onerror = () => {
          console.error('Lỗi đọc file:', file.name);
          resolve(null);
        };
        
        reader.readAsDataURL(file);
      });
    };

    try {
      // Xử lý tất cả files
      const imagePromises = fileArray.map(file => processFile(file));
      const newImagePreviews = await Promise.all(imagePromises);
      
      // Lọc ra các preview hợp lệ
      const validPreviews = newImagePreviews.filter(preview => preview !== null);
      console.log('Valid previews:', validPreviews.length);

      if (validPreviews.length > 0) {
        // Cập nhật images state
        const currentImages = Array.isArray(images) ? images : [];
        const updatedImages = [...currentImages, ...validPreviews];
        console.log('Updated images:', updatedImages);
        onImagesChange(updatedImages);
      }
    } catch (error) {
      console.error('Error processing files:', error);
    }

    // Reset input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    if (urlInput.trim() && !safeImages.includes(urlInput)) {
      console.log('Adding URL:', urlInput);
      const currentImages = Array.isArray(images) ? images : [];
      const updatedImages = [...currentImages, urlInput];
      onImagesChange(updatedImages);
      setUrlInput("");
    }
  };

  const handleRemoveImage = (index) => {
    console.log('Removing image at index:', index);
    const currentImages = Array.isArray(images) ? images : [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
    
    // Cũng xóa file tương ứng nếu có
    const currentFiles = Array.isArray(onImageFilesChange) ? onImageFilesChange : [];
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    onImageFilesChange(updatedFiles);
  };

  const handleSetMainImage = (index) => {
    console.log('Setting main image:', index);
    const currentImages = Array.isArray(images) ? images : [];
    const newImages = [...currentImages];
    const [movedImage] = newImages.splice(index, 1);
    newImages.unshift(movedImage);
    onImagesChange(newImages);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    console.log('Files dropped:', files);
    if (files && files.length > 0) {
      const event = {
        target: { files }
      };
      handleFileUpload(event);
    }
  };

  console.log('Current safeImages:', safeImages);

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        Hình ảnh sản phẩm ({safeImages.length} ảnh)
      </Typography>

      {/* Upload từ máy - Vùng kéo thả */}
      <Box
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          backgroundColor: 'grey.50',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Kéo thả ảnh vào đây hoặc click để chọn
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Chọn nhiều ảnh cùng lúc từ máy tính của bạn
        </Typography>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
        <Divider sx={{ flex: 1 }} />
        <Typography variant="caption" sx={{ px: 2, color: 'text.secondary' }}>
          Hoặc
        </Typography>
        <Divider sx={{ flex: 1 }} />
      </Box>

      {/* Thêm từ URL */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          label="URL ảnh"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          fullWidth
          placeholder="https://example.com/image.jpg"
          size="small"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddUrl();
            }
          }}
        />
        <Button 
          variant="contained" 
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          sx={{ minWidth: 80 }}
        >
          Thêm
        </Button>
      </Box>

      {/* Danh sách ảnh đã chọn */}
      {safeImages.length > 0 ? (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Ảnh đã chọn ({safeImages.length})
          </Typography>
          
          <Grid container spacing={2}>
            {safeImages.map((img, idx) => (
              <Grid item xs={6} sm={4} md={3} key={idx}>
                <Box 
                  sx={{ 
                    position: 'relative',
                    width: '100%',
                    height: 120,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `3px solid ${idx === 0 ? '#1976d2' : '#e0e0e0'}`,
                    '&:hover': {
                      boxShadow: 2,
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={img}
                    alt={`Ảnh ${idx + 1}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      console.error('Error loading image:', img);
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCA1MEg2MFY3MEg4MFY1MFoiIGZpbGw9IiM5QzlDOUMiLz4KPHBhdGggZD0iTTcwIDYwVjUwSDYwVjcwSDgwVjYwSDcwWiIgZmlsbD0iI0JEQkRCRCIvPgo8L3N2Zz4K';
                    }}
                  />
                  
                  {/* Badge ảnh chính */}
                  {idx === 0 && (
                    <Chip
                      label="Ảnh chính"
                      size="small"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                  )}
                  
                  {/* Số thứ tự */}
                  <Chip
                    label={idx + 1}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      fontWeight: 'bold',
                      height: 20,
                      minWidth: 24
                    }}
                  />
                  
                  {/* Nút xóa */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(idx);
                    }}
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      bgcolor: 'error.main',
                      color: 'white',
                      width: 24,
                      height: 24,
                      '&:hover': {
                        bgcolor: 'error.dark'
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  
                  {/* Nút đặt làm ảnh chính (cho ảnh không phải đầu tiên) */}
                  {idx !== 0 && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetMainImage(idx);
                      }}
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        left: 4,
                        minWidth: 'auto',
                        px: 1,
                        fontSize: '0.6rem',
                        height: 24,
                        bgcolor: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.dark'
                        }
                      }}
                    >
                      Chính
                    </Button>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Hướng dẫn */}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="caption" color="info.contrastText" sx={{ fontSize: '0.75rem' }}>
              Ảnh đầu tiên là ảnh chính. Click "Chính" để thay đổi ảnh chính.
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box 
          sx={{ 
            mt: 3,
            p: 4,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 2,
            bgcolor: 'grey.50'
          }}
        >
          <ImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Chưa có ảnh nào được chọn
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Kéo thả ảnh vào vùng trên hoặc click để chọn từ máy tính
          </Typography>
        </Box>
      )}
    </Card>
  );
}