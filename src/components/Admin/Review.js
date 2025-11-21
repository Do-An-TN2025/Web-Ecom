import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import reviewService from '../../services/reviewService';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Button,
  Avatar,
  Rating,
  Stack,
  Divider,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d || '';
  }
}

function initials(name = '') {
  return name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const Review = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const fetch = useCallback(async (p = page, ps = pageSize, q = query) => {
    try {
      setLoading(true);
      const res = await reviewService.getAllReviews(p, ps, q ? { q } : {});
      const itemsRaw = res?.items || res?.reviews || res?.data || (Array.isArray(res) ? res : []) || [];
      const totalCount = res?.total || res?.count || res?.meta?.total || (Array.isArray(itemsRaw) ? itemsRaw.length : 0);

      const mapped = (itemsRaw || []).map((r) => ({
        id: r._id || r.id,
        comment: r.comment || r.text || r.content || r.comment || '',
        rating: r.rating ?? r.stars ?? 0,
        createdAt: r.createdAt || r.date || r.updatedAt || '',
        product: r.productId && (r.productId.name || r.productId.title) ? { id: r.productId._id || r.productId.id, name: r.productId.name || r.productId.title, slug: r.productId.slug } : (r.product && (r.product.name || r.product.title) ? { id: r.product._id || r.product.id, name: r.product.name || r.product.title, slug: r.product.slug } : null),
        user: r.userId ? { id: r.userId._id || r.userId.id, firstName: r.userId.firstName || r.userId.firstName, lastName: r.userId.lastName || r.userId.lastName, email: r.userId.email } : (r.user || r.author || r.customer ? { id: r.user?._id || r.user?.id, firstName: r.user?.firstName || r.user?.name, lastName: r.user?.lastName || '', email: r.user?.email || r.email } : null),
        raw: r,
      }));

      setItems(mapped);
      setTotal(Number(totalCount) || mapped.length);
      if (!selected && mapped.length) setSelected(mapped[0]);
    } catch (err) {
      console.error('[Admin.Review] fetch failed', err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query, selected]);

  useEffect(() => {
    fetch(page, pageSize, query);
  }, [fetch, page, pageSize, query]);

  const onSearch = () => { setPage(1); fetch(1, pageSize, query); };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>Quản lý đánh giá khách hàng</Typography>
          <Typography variant="body2" color="text.secondary">Xem, duyệt và quản lý đánh giá của khách hàng — tìm theo sản phẩm hoặc người đánh giá.</Typography>
        </Paper>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Tìm sản phẩm hoặc người đánh giá..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={onSearch} size="small">
                  <SearchIcon />
                </IconButton>
              ),
            }}
            sx={{ width: 420 }}
          />
          <Button variant="outlined" onClick={() => { setQuery(''); setPage(1); fetch(1, pageSize, ''); }}>Reset</Button>
          {loading && <CircularProgress size={20} />}
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 3 }}>
          <Paper sx={{ p: 2, minHeight: 520 }}>
            <Stack spacing={2}>
              {items.length === 0 && !loading && (
                <Typography color="text.secondary">Không có đánh giá.</Typography>
              )}

              {items.map((it) => (
                <Paper
                  key={it.id}
                  onClick={() => setSelected(it)}
                  elevation={selected?.id === it.id ? 6 : 1}
                  sx={{ p: 2, cursor: 'pointer', borderLeft: selected?.id === it.id ? '4px solid #f59e0b' : '4px solid transparent' }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar sx={{ width: 56, height: 56, bgcolor: '#f3f4f6' }}>
                      {it.user ? (it.user.firstName ? initials(`${it.user.firstName} ${it.user.lastName || ''}`) : (it.user.email ? initials(it.user.email.split('@')[0]) : '?')) : '?'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>{it.user ? `${it.user.firstName || ''} ${it.user.lastName || ''}`.trim() || it.user.email : 'Khách ẩn danh'}</Typography>
                          <Typography variant="caption" color="text.secondary">{it.user?.email}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Rating value={Number(it.rating)} size="small" readOnly />
                          <Typography variant="caption" display="block" color="text.secondary">{formatDate(it.createdAt)}</Typography>
                        </Box>
                      </Stack>

                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {it.comment}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        {it.product ? (
                          <Button size="small" startIcon={<OpenInNewIcon />} onClick={(e) => { e.stopPropagation(); window.open(`/product/${it.product.slug}`, '_blank'); }}>
                            {it.product.name}
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Sản phẩm không xác định</Typography>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              ))}

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <Pagination
                  count={Math.max(1, Math.ceil(total / pageSize))}
                  page={page}
                  onChange={(e, v) => { setPage(v); fetch(v, pageSize, query); }}
                  color="primary"
                />
              </Box>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, minHeight: 520 }}>
            {selected ? (
              <Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ width: 72, height: 72, bgcolor: '#f3f4f6' }}>{selected.user ? initials(`${selected.user.firstName || ''} ${selected.user.lastName || ''}`) : '?'}</Avatar>
                  <Box>
                    <Typography variant="h6">{selected.user ? `${selected.user.firstName || ''} ${selected.user.lastName || ''}`.trim() : 'Khách ẩn danh'}</Typography>
                    <Typography variant="body2" color="text.secondary">{selected.user?.email}</Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2">Đánh giá</Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Rating value={Number(selected.rating)} readOnly />
                  <Typography variant="body2" color="text.secondary">{formatDate(selected.createdAt)}</Typography>
                </Stack>

                <Typography variant="subtitle2">Nội dung</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{selected.comment}</Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2">Sản phẩm</Typography>
                {selected.product ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body1" fontWeight={600}>{selected.product.name}</Typography>
                    <Button size="small" onClick={() => window.open(`/product/${selected.product.slug}`, '_blank')} startIcon={<OpenInNewIcon />}>Mở sản phẩm</Button>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">Không có thông tin sản phẩm</Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                {loading ? <CircularProgress /> : <Typography color="text.secondary">Chọn một đánh giá để xem chi tiết</Typography>}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default Review;