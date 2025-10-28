import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { CheckCircle, Package, Truck, XCircle, Clock, Search, Eye, AlertCircle } from "lucide-react";
import orderService from "../services/orderService";

// Modal chúc mừng đặt hàng thành công
function OrderSuccessModal({ orderCode, onClose, onViewOrder }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await orderService.checkPaymentStatus(orderCode);
        setOrder(data);
      } catch (err) {
        setError(err.message || "Không thể tải thông tin đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    
    if (orderCode) {
      fetchOrder();
    }
  }, [orderCode]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Có lỗi xảy ra</h3>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const paymentMethod = order.paymentMethod || {};
  const paymentUrl = paymentMethod.checkoutUrl || paymentMethod.invoiceUrl;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
        {/* Icon thành công */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Tiêu đề */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          🎉 Đặt hàng thành công!
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Cảm ơn bạn đã tin tưởng và đặt hàng
        </p>

        {/* Thông tin đơn hàng */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Mã đơn hàng:</span>
            <span className="font-semibold text-gray-800">{order.orderCode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tổng tiền:</span>
            <span className="font-bold text-green-600 text-lg">
              {(order.totalAmount || 0).toLocaleString()}đ
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Thanh toán:</span>
            <span className="text-sm font-medium text-gray-800">
              {paymentMethod.type || "COD"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Trạng thái:</span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              paymentMethod.status === 'paid' ? 'bg-green-100 text-green-800' :
              paymentMethod.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {paymentMethod.status === 'paid' ? 'Đã thanh toán' :
               paymentMethod.status === 'pending' ? 'Chờ thanh toán' :
               paymentMethod.status || 'Chưa xác định'}
            </span>
          </div>
          {order.shippingAddress && (
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">Người nhận:</span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  {order.shippingAddress.fullName}
                </div>
                <div className="text-xs text-gray-500">
                  {order.shippingAddress.phone}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sản phẩm */}
        {order.items && order.items.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sản phẩm đã đặt:</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 bg-white border rounded-lg p-3">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.color && `${item.color}`}
                      {item.size && ` · ${item.size}`}
                      {item.quantity && ` · SL: ${item.quantity}`}
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mt-1">
                      {(item.price || 0).toLocaleString()}đ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thông báo thanh toán */}
        {paymentUrl && paymentMethod.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800 mb-2">
              ⚠️ Bạn cần hoàn tất thanh toán để đơn hàng được xử lý
            </p>
          </div>
        )}

        {/* Thông báo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-800">
            📦 Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ liên hệ sớm nhất để xác nhận.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {paymentUrl && paymentMethod.status === 'pending' && (
            <button
              onClick={() => window.open(paymentUrl, '_blank')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              💳 Thanh toán ngay
            </button>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => onViewOrder(order.orderCode)}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Xem đơn hàng
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component hiển thị trạng thái
function OrderStatusBadge({ status }) {
  const statusConfig = {
    pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
    processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800", icon: Package },
    shipping: { label: "Đang giao", color: "bg-purple-100 text-purple-800", icon: Truck },
    delivered: { label: "Đã giao", color: "bg-green-100 text-green-800", icon: Package },
    cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800", icon: XCircle },
    completed: { label: "Hoàn thành", color: "bg-green-100 text-green-800", icon: CheckCircle }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// Card đơn hàng
function OrderCard({ order, onViewDetail }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-xs text-gray-500">Mã đơn hàng</div>
          <div className="font-semibold text-gray-800">{order.orderCode}</div>
        </div>
        <OrderStatusBadge status={order.orderStatus} />
      </div>

      {order.items && order.items.length > 0 && (
        <div className="space-y-2 mb-3">
          {order.items.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex gap-3">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                <div className="text-xs text-gray-500">
                  {item.color && `${item.color}`}
                  {item.size && ` · ${item.size}`}
                  {item.quantity && ` · x${item.quantity}`}
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700">
                {(item.price || 0).toLocaleString()}đ
              </div>
            </div>
          ))}
          {order.items.length > 2 && (
            <div className="text-xs text-gray-500 pl-15">
              +{order.items.length - 2} sản phẩm khác
            </div>
          )}
        </div>
      )}

      <div className="border-t pt-3 flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-500">Tổng tiền</div>
          <div className="text-lg font-bold text-green-600">
            {(order.totalAmount || 0).toLocaleString()}đ
          </div>
        </div>
        <button
          onClick={() => onViewDetail(order.orderCode)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Chi tiết
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        {new Date(order.createdAt).toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}
      </div>
    </div>
  );
}

// Component chính
export default function OrderManagement() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
  const { orderCode: routeOrderCode } = useParams(); // <-- read /orders/:orderCode
  const [routeOrder, setRouteOrder] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderCode, setSuccessOrderCode] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const token = (() => {
    try {
      return localStorage.getItem("auth_token");
    } catch {
      return null;
    }
  })();

  // Check URL params khi load trang (mới: nếu chỉ có orderCode -> fetch và chuyển tới /orders/:orderCode)
  useEffect(() => {
    const orderCode = searchParams.get("orderCode");
    const success = searchParams.get("success");

    // If explicit success flag -> show modal (preserve current behaviour)
    if (success === "true" && orderCode) {
      setSuccessOrderCode(orderCode);
      setShowSuccessModal(true);
      try { window.history.replaceState({}, "", window.location.pathname); } catch {}
      return;
    }

    // If only orderCode present (gateway redirect) -> check status, save and navigate to detail
    if (orderCode) {
      let mounted = true;
      (async () => {
        try {
          const data = await orderService.checkPaymentStatus(orderCode);
          if (!mounted) return;
          // persist last order info
          try { localStorage.setItem("lastOrder", JSON.stringify(data)); } catch {}
          try { localStorage.setItem("lastOrderCode", orderCode); } catch {}
          // go to order detail page
          navigate(`/orders/${orderCode}`);
        } catch (err) {
          // If check failed, fallback to showing modal so user can still see a message
          if (!mounted) return;
          setSuccessOrderCode(orderCode);
          setShowSuccessModal(true);
        } finally {
          try { window.history.replaceState({}, "", window.location.pathname); } catch {}
        }
      })();
      return () => { mounted = false; };
    }
  }, [searchParams, navigate]);
  
  // Nếu route param /orders/:orderCode tồn tại -> mở modal thành công (OrderSuccessModal sẽ fetch)
  useEffect(() => {
    if (!routeOrderCode) {
      setRouteOrder(null);
      setRouteError(null);
      setRouteLoading(false);
      return;
    }

    // Hiển thị modal success thay vì hiển thị detail page
    setSuccessOrderCode(routeOrderCode);
    setShowSuccessModal(true);
    try { localStorage.setItem("lastOrderCode", routeOrderCode); } catch {}

    // không cần fetch ở đây — OrderSuccessModal sẽ gọi checkPaymentStatus(orderCode)
    // nếu bạn muốn xóa param từ URL sau khi hiển thị modal, có thể uncomment:
    // try { window.history.replaceState({}, "", "/orders"); } catch {}
  }, [routeOrderCode]);

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

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setSuccessOrderCode(null);
  };

  const handleViewOrder = (orderCode) => {
    setShowSuccessModal(false);
    navigate(`/orders/${orderCode}`);
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
                         item.name.toLowerCase().includes(searchQuery.toLowerCase())
                       ));
    const matchStatus = filterStatus === "all" || order.orderStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === "pending").length,
    shipping: orders.filter(o => o.orderStatus === "shipping").length,
    delivered: orders.filter(o => o.orderStatus === "delivered" || o.orderStatus === "completed").length,
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem danh sách đơn hàng</p>
          <button
            onClick={() => navigate("/account/login")}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Modal */}
      {showSuccessModal && successOrderCode && (
        <OrderSuccessModal 
          orderCode={successOrderCode}
          onClose={handleCloseModal}
          onViewOrder={handleViewOrder}
        />
      )}

        {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Đơn hàng của tôi</h1>
              <p className="text-gray-600 mt-1">Quản lý và theo dõi đơn hàng của bạn</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Trang chủ
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hoặc tên sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">Tất cả đơn hàng</option>
              <option value="pending">Chờ xử lý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="processing">Đang xử lý</option>
              <option value="shipping">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              🔄 {loading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Có lỗi xảy ra</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-600">Tổng đơn hàng</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
              <div className="text-2xl font-bold text-gray-800">{stats.pending}</div>
              <div className="text-sm text-gray-600">Chờ xử lý</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
              <div className="text-2xl font-bold text-gray-800">{stats.shipping}</div>
              <div className="text-sm text-gray-600">Đang giao</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
              <div className="text-2xl font-bold text-gray-800">{stats.delivered}</div>
              <div className="text-sm text-gray-600">Đã giao</div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách đơn hàng...</p>
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Không tìm thấy đơn hàng
            </h3>
            <p className="text-gray-500">
              {searchQuery || filterStatus !== "all" 
                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                : "Bạn chưa có đơn hàng nào"}
            </p>
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(order => (
              <OrderCard 
                key={order._id} 
                order={order}
                onViewDetail={handleViewOrder}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}