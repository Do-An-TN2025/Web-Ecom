import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, Truck, CheckCircle, XCircle, Clock, Search, Eye, AlertCircle, ArrowLeft, ShoppingBag, Star, X } from "lucide-react";
import { toast } from "react-toastify";
import orderService from "../services/orderService";
import reviewService from "../services/reviewService";
import resolveImage from '../helpers/imageUtils';

// Component hiển thị trạng thái
function OrderStatusBadge({ status }) {
  const statusConfig = {
    pending: { label: "Chờ xử lý", color: "text-yellow-700", dot: "bg-yellow-700" },
    paid: { label: "Đã thanh toán", color: "text-blue-700", dot: "bg-blue-700" },
    processing: { label: "Đang xử lý", color: "text-orange-700", dot: "bg-orange-700" },
    shipping: { label: "Đang giao", color: "text-indigo-700", dot: "bg-indigo-700" },
    delivered: { label: "Đã giao", color: "text-green-700", dot: "bg-green-700" },
    completed: { label: "Hoàn thành", color: "text-green-700", dot: "bg-green-700" },
    cancelled: { label: "Đã hủy", color: "text-red-700", dot: "bg-red-700" },
    refunded: { label: "Hoàn tiền", color: "text-purple-700", dot: "bg-purple-700" }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.color}`}>
      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// Review Modal Component
function ReviewModal({ order, isOpen, onClose, onSubmit }) {
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [overallRating, setOverallRating] = useState(5);
  const [overallComment, setOverallComment] = useState("");

  if (!isOpen || !order) return null;

  const handleRatingChange = (itemId, rating) => {
    setRatings(prev => ({ ...prev, [itemId]: rating }));
  };

  const handleCommentChange = (itemId, comment) => {
    setComments(prev => ({ ...prev, [itemId]: comment }));
  };

  const handleSubmit = () => {
    const reviewData = {
      orderCode: order.orderCode,
      overallRating,
      overallComment,
      items: order.items.map((item, idx) => {
        // Extract productId string (handle both populated object and string ID)
        const productIdValue = typeof item.productId === 'object' 
          ? item.productId._id 
          : (item.productId || item._id);
        
        const itemKey = productIdValue || `item-${idx}`;
        
        return {
          productId: productIdValue,
          productName: item.name,
          rating: ratings[itemKey] || 5,
          comment: comments[itemKey] || ""
        };
      })
    };
    onSubmit(reviewData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Đánh giá đơn hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overall Rating */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Đánh giá chung
            </label>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setOverallRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={star <= overallRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm mua hàng của bạn..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none resize-none"
              rows={3}
            />
          </div>

          {/* Products Rating */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Đánh giá sản phẩm</h3>
            {order.items.map((item, idx) => {
              // Extract productId string (handle both populated object and string ID)
              const itemKey = typeof item.productId === 'object' 
                ? item.productId._id 
                : (item.productId || item._id || `item-${idx}`);
              
              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-4 mb-3">
                    <img
                        src={resolveImage(item.image || item.productId?.images?.[0] || '/placeholder.jpg')}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded border border-gray-200"
                      />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                        {item.name}
                      </h4>
                      <div className="text-xs text-gray-500">
                        {item.color && <span>Phân loại: {item.color}</span>}
                        {item.size && <span> · Size: {item.size}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(itemKey, star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          size={24}
                          className={star <= (ratings[itemKey] || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                        />
                      </button>
                    ))}
                  </div>
                  
                  <textarea
                    value={comments[itemKey] || ""}
                    onChange={(e) => handleCommentChange(itemKey, e.target.value)}
                    placeholder="Nhận xét về sản phẩm này..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none resize-none"
                    rows={2}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Gửi đánh giá
          </button>
        </div>
      </div>
    </div>
  );
}

// Order Item Row (List style)
function OrderRow({ order, onViewDetail, onReview }) {
    const navigate = useNavigate();
  return (
    <div className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* Header: Shop name + Status */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">ShopNow</span>
        </div>
        <OrderStatusBadge status={order.orderStatus} />
      </div>

      {/* Products List */}
      <div className="px-6 py-4">
        {order.items && order.items.length > 0 && (
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                {/* Product Image */}
                <div className="w-20 h-20 flex-shrink-0">
                  <img 
                    src={resolveImage(item.image || item.productId?.images?.[0] || '/placeholder.jpg')}
                    alt={item.name}
                    className="w-full h-full object-cover rounded border border-gray-200"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {item.name}
                  </h3>
                  <div className="text-xs text-gray-500 mb-2">
                    {item.color && <span>Phân loại: {item.color}</span>}
                    {item.size && <span> · Size: {item.size}</span>}
                  </div>
                  <div className="text-xs text-gray-600">x{item.quantity || 1}</div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {(item.price || 0).toLocaleString()}đ
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Total + Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-xs text-gray-600">
          Mã đơn: <span className="font-medium text-gray-900">#{order.orderCode}</span>
          <span className="mx-2">·</span>
          {new Date(order.createdAt).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          })}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500">Thành tiền:</div>
            <div className="text-lg font-bold text-orange-600">
              {(order.totalAmount || 0).toLocaleString()}đ
            </div>
          </div>
          <div className="flex gap-2">
            {order.orderStatus === "completed" && (
              <button
                onClick={() => onReview(order)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded transition-colors"
              >
                Đánh giá
              </button>
            )}
            <button
              onClick={() => onViewDetail(order.orderCode)}
              className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-sm font-medium rounded transition-colors"
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component chính
export default function OrderManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);

  const token = (() => {
    try {
      return localStorage.getItem("auth_token");
    } catch {
      return null;
    }
  })();

  // Check if redirected from payment and navigate to order detail
  useEffect(() => {
    const orderCode = searchParams.get("orderCode");
    const success = searchParams.get("success");

    if (orderCode) {
      // Clean URL
      window.history.replaceState({}, "", "/orders");
      // Navigate to order detail
      navigate(`/orders/${orderCode}`);
    }
  }, [searchParams, navigate]);

  // Load orders
  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getMyOrders(token);
        
        if (!mounted) return;
        
        // Handle both array response and paginated response
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data.data && Array.isArray(data.data)) {
          setOrders(data.data);
        } else {
          setOrders([]);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Không thể tải danh sách đơn hàng");
          setOrders([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
    return () => { mounted = false; };
  }, [token]);

  const handleViewOrder = (orderCode) => {
    navigate(`/orders/${orderCode}`);
  };

  const handleOpenReview = (order) => {
    setSelectedOrderForReview(order);
    setReviewModalOpen(true);
  };

  const handleCloseReview = () => {
    setReviewModalOpen(false);
    setSelectedOrderForReview(null);
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      // Submit reviews for all products in the order
      const result = await reviewService.submitOrderReview(
        reviewData.orderCode,
        reviewData,
        token
      );
      
      // Show success message
      if (result.failedCount > 0) {
        toast.warning(
          `Đã gửi ${result.successCount}/${reviewData.items.length} đánh giá. Một số đánh giá không thành công.`,
          { position: "top-right", autoClose: 3000 }
        );
      } else {
        toast.success(
          "Cảm ơn bạn đã đánh giá! Đánh giá của bạn đã được gửi thành công.",
          { position: "top-right", autoClose: 3000 }
        );
      }
      
      handleCloseReview();
      // Optionally refresh orders to update UI
      handleRefresh();
    } catch (err) {
      console.error("Failed to submit review:", err);
        toast.error(
        err.message || "Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!",
        { position: "top-right", autoClose: 4000 }
      );
    }
  };

  const handleRefresh = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getMyOrders(token);
      
      if (Array.isArray(data)) {
        setOrders(data);
      } else if (data.data && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError(err.message || "Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchSearch = order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (order.items && order.items.some(item => 
                         item.name?.toLowerCase().includes(searchQuery.toLowerCase())
                       ));
    const matchStatus = filterStatus === "all" || order.orderStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  // Group orders by month (only for "all" tab)
  const groupedOrders = React.useMemo(() => {
    if (filterStatus !== "all") {
      return null; // Don't group if not "all" tab
    }

    const groups = {};
    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          label: monthLabel,
          orders: []
        };
      }
      groups[monthKey].orders.push(order);
    });

    // Sort by month (newest first)
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, value]) => value);
  }, [filteredOrders, filterStatus]);

  // Count orders by status
  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => o.orderStatus === "pending").length,
    processing: orders.filter(o => o.orderStatus === "processing").length,
    shipping: orders.filter(o => o.orderStatus === "shipping").length,
    delivered: orders.filter(o => o.orderStatus === "delivered").length,
    completed: orders.filter(o => o.orderStatus === "completed").length,
    cancelled: orders.filter(o => o.orderStatus === "cancelled").length,
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem danh sách đơn hàng</p>
          <button
            onClick={() => navigate("/account/login")}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium mb-3"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Đơn hàng của tôi</h1>
        </div>
      </div>

      {/* Tabs Navigation - Shopee Style */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                filterStatus === "all"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Tất cả {orderCounts.all > 0 && <span className="ml-1">({orderCounts.all})</span>}
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                filterStatus === "pending"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Chờ xác nhận {orderCounts.pending > 0 && <span className="ml-1">({orderCounts.pending})</span>}
            </button>
            <button
              onClick={() => setFilterStatus("processing")}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                filterStatus === "processing"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Đang xử lý {orderCounts.processing > 0 && <span className="ml-1">({orderCounts.processing})</span>}
            </button>
            <button
              onClick={() => setFilterStatus("shipping")}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                filterStatus === "shipping"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Đang giao {orderCounts.shipping > 0 && <span className="ml-1">({orderCounts.shipping})</span>}
            </button>
            <button
              onClick={() => setFilterStatus("delivered")}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                filterStatus === "delivered"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Đã giao {orderCounts.delivered > 0 && <span className="ml-1">({orderCounts.delivered})</span>}
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                filterStatus === "completed"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Hoàn thành {orderCounts.completed > 0 && <span className="ml-1">({orderCounts.completed})</span>}
            </button>
            <button
              onClick={() => setFilterStatus("cancelled")}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                filterStatus === "cancelled"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Đã hủy {orderCounts.cancelled > 0 && <span className="ml-1">({orderCounts.cancelled})</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hàng hoặc tên sản phẩm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Có lỗi xảy ra</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-orange-500 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Đang tải đơn hàng...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Chưa có đơn hàng
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchQuery 
                ? "Không tìm thấy đơn hàng phù hợp"
                : "Bạn chưa có đơn hàng nào trong mục này"}
            </p>
            {filterStatus !== "all" && (
              <button
                onClick={() => setFilterStatus("all")}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Xem tất cả đơn hàng
              </button>
            )}
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length > 0 && (
          <div>
            {/* Group by month (only for "all" tab) */}
            {filterStatus === "all" && groupedOrders ? (
              <div className="space-y-6">
                {groupedOrders.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {/* Month Header */}
                    <div className="bg-gray-100 px-4 py-2 rounded-lg mb-3">
                      <h2 className="text-sm font-semibold text-gray-700">{group.label}</h2>
                    </div>
                    {/* Orders in this month */}
                    <div className="space-y-3">
                      {group.orders.map(order => (
                        <OrderRow 
                          key={order._id} 
                          order={order}
                          onViewDetail={handleViewOrder}
                          onReview={handleOpenReview}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Regular list (for other tabs)
              <div className="space-y-3">
                {filteredOrders.map(order => (
                  <OrderRow 
                    key={order._id} 
                    order={order}
                    onViewDetail={handleViewOrder}
                    onReview={handleOpenReview}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        order={selectedOrderForReview}
        isOpen={reviewModalOpen}
        onClose={handleCloseReview}
        onSubmit={handleSubmitReview}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}