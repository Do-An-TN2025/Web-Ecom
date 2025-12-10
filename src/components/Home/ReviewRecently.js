import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import resolveImage from '../../helpers/imageUtils';
import reviewService from '../../services/reviewService';

const ReviewCard = ({ item }) => {
  const user = item.user || {};
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || item.customerName || 'Khách hàng';
  const avatar = user.avatar || '';
  const productName = item.product?.name || item.productName || item.title || '';
  const productSlug = item.product?.slug || '';
  const comment = item.comment || item.content || '';
  const rating = item.rating || item.stars || 0;
  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';

  // Always render a placeholder image box so layout is consistent when there are no images
  return (
    <div className="p-6 bg-white rounded-md shadow-md border flex flex-col md:flex-row items-start gap-4">
      <div className="flex-1 flex flex-col justify-start">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full overflow-hidden">
              {avatar ? (
                <img src={resolveImage(avatar)} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-sm font-medium text-gray-700">{name.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className="text-sm font-semibold text-gray-800">{name}</div>
          </div>

          <div className="text-xs text-gray-500">{date}</div>
        </div>

        <div className="mt-2 flex items-start gap-4">
          <div className="text-yellow-500 text-sm leading-none">
            {'★'.repeat(Math.max(0, Math.min(5, rating)))}
          </div>

          <div className="text-sm text-gray-700 break-words">{comment}</div>
        </div>

        {item.adminReply && item.adminReply.message && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md border-l-4 border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full overflow-hidden text-sm font-medium text-blue-700">
                  {item.adminReply?.adminId ? ((item.adminReply.adminId.firstName || '').charAt(0) || 'A') : 'A'}
                </div>
                <div className="text-sm font-semibold text-gray-800">{item.adminReply?.adminId ? `${item.adminReply.adminId.firstName || ''} ${item.adminReply.adminId.lastName || ''}`.trim() : 'Quản trị viên'}</div>
              </div>
              <div className="text-xs text-gray-500">{item.adminReply?.repliedAt ? new Date(item.adminReply.repliedAt).toLocaleDateString() : ''}</div>
            </div>

            <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{item.adminReply.message}</div>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500">
          {productSlug ? (
            <Link to={`/product/${productSlug}`} className="text-blue-600 hover:underline">{productName}</Link>
          ) : (
            productName
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewRecently = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchRecent = async () => {
      try {
        setLoading(true);
        const data = await reviewService.getLatestFiveCustomerReviews();
        if (!mounted) return;

        // Handle possible response shapes:
        // 1) Array of reviews
        // 2) { reviews: [...] , count }
        // 3) { items: [...] } or { data: [...] }
        let items = [];
        if (Array.isArray(data)) items = data;
        else if (Array.isArray(data.reviews)) items = data.reviews;
        else if (Array.isArray(data.items)) items = data.items;
        else if (Array.isArray(data.data)) items = data.data;

        setReviews(items.slice(0, 5));
      } catch (err) {
        console.error('Failed to load recent reviews', err);
        setError(err?.message || 'Lỗi khi tải dữ liệu');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRecent();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="mt-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold">PHẢN HỒI TỪ KHÁCH HÀNG <span className="ml-2">💌✨</span></h2>
        <div className="mt-2">
          <a href="/reviews" className="text-sm text-blue-600">Xem tất cả</a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {loading && (
          <div className="col-span-full space-y-3">
            {[1,2,3].map(s => (
              <div key={s} className="animate-pulse h-44 bg-gray-100 rounded-md" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div className="col-span-full text-sm text-gray-500">Chưa có đánh giá gần đây.</div>
        )}

        {!loading && !error && reviews.map((r, idx) => (
          <div key={r._id || r.id || idx}>
            <ReviewCard item={r} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewRecently;