import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, XCircle, Clock, MapPin, CreditCard, Tag, ArrowLeft, FileText, User, Home } from 'lucide-react';
import { getOrderByCode } from '../services/orderService';

function OrderTimeline({ currentStatus }) {
  const steps = [
    { key: 'confirmed', label: 'Xác nhận', icon: CheckCircle },
    { key: 'shipped', label: 'Đã gửi', icon: Package },
    { key: 'shipping', label: 'Đang giao', icon: Truck },
    { key: 'delivered', label: 'Đã giao', icon: Home },
  ];

  // Map status to step index
  const getCompletedSteps = (status) => {
    switch(status) {
      case 'pending':
      case 'paid':
        return 0; // Xác nhận
      case 'shipped':
        return 1; // Xác nhận + Đã gửi
      case 'delivered':
        return 2; // Xác nhận + Đã gửi + Đang giao
      case 'completed':
        return 3; // Tất cả
      default:
        return -1;
    }
  };

  const completedSteps = getCompletedSteps(currentStatus);

  if (currentStatus === 'cancelled') {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6 mb-4">
        <div className="flex items-center justify-center gap-3 text-red-600">
          <XCircle size={24} />
          <span className="font-semibold">Đơn hàng đã bị hủy</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 mx-8">
          <div 
            className="h-full bg-green-500 transition-all duration-500"
            style={{ 
              width: completedSteps >= 0 ? `${(completedSteps / (steps.length - 1)) * 100}%` : '0%'
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index <= completedSteps;
            
            return (
              <div key={step.key} className="flex flex-col items-center">
                {/* Icon Circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle size={20} fill="white" strokeWidth={0} />
                  ) : (
                    <StepIcon size={20} />
                  )}
                </div>
                
                {/* Label */}
                <div className={`mt-3 text-xs font-medium text-center transition-colors ${
                  isCompleted ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { text: 'text-yellow-700', label: 'Chờ xử lý' },
    paid: { text: 'text-blue-700', label: 'Đã thanh toán' },
    processing: { text: 'text-orange-700', label: 'Đang xử lý' },
    shipping: { text: 'text-indigo-700', label: 'Đang giao' },
    delivered: { text: 'text-green-700', label: 'Đã giao' },
    completed: { text: 'text-green-700', label: 'Hoàn thành' },
    cancelled: { text: 'text-red-700', label: 'Đã hủy' },
    refunded: { text: 'text-purple-700', label: 'Hoàn tiền' },
  };
  const config = map[status] || { text: 'text-gray-700', label: status };
  
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${config.text}`}>
      <div className={`w-2 h-2 rounded-full ${config.text.replace('text-', 'bg-')}`} />
      {config.label}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="bg-white rounded-lg border p-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-lg border h-96" />
            <div className="bg-white rounded-lg border h-96" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { orderCode } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getOrderByCode(orderCode)
      .then((res) => {
        if (!mounted) return;
        setOrder(res);
      })
      .catch((err) => {
        console.error('getOrderByCode', err);
        if (mounted) setError(err);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [orderCode]);

  if (loading) return <Skeleton />;
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Không thể tải đơn hàng</h3>
          <p className="text-sm text-gray-600 mb-6">{error.message || 'Đã xảy ra lỗi'}</p>
          <Link 
            to="/orders" 
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg border p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Đơn hàng không tồn tại</p>
        </div>
      </div>
    );
  }

  const {
    orderCode: code,
    orderStatus,
    createdAt,
    items = [],
    shippingAddress = {},
    paymentMethod = {},
    subtotal,
    shippingFee,
    discount,
    totalAmount,
    customerNote,
    voucher,
    userId
  } = order;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 font-medium"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách đơn
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Đơn hàng #{code}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Clock size={16} />
                  {new Date(createdAt).toLocaleDateString('vi-VN', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <StatusBadge status={orderStatus} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Tổng thanh toán</div>
              <div className="text-2xl font-bold text-gray-900">{totalAmount.toLocaleString('vi-VN')}đ</div>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <OrderTimeline currentStatus={orderStatus} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Products */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Sản phẩm ({items.length})</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <div key={idx} className="p-4 flex gap-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                      <img
                        src={item.image || item.productId?.images?.[0] || '/placeholder.jpg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm">
                        {item.name || item.productId?.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2">
                        {item.color && (
                          <span className="inline-flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full border border-gray-300" 
                              style={{ backgroundColor: item.variantId?.colorCode || '#ccc' }} 
                            />
                            {item.color}
                          </span>
                        )}
                        {item.size && <span>• Size: {item.size}</span>}
                        <span>• SL: {item.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{item.price.toLocaleString('vi-VN')}đ</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {customerNote && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex gap-2">
                    <FileText size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Ghi chú</div>
                      <p className="text-sm text-gray-600">{customerNote}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Payment Method */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={18} className="text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Thanh toán</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức</span>
                  <span className="font-medium text-gray-900">
                    {paymentMethod.type === 'COD' ? 'COD' : paymentMethod.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái</span>
                  <span className={`font-medium ${
                    paymentMethod.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {paymentMethod.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Địa chỉ giao hàng</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="font-medium text-gray-900">{shippingAddress.fullName}</div>
                <div className="text-gray-600">{shippingAddress.phone}</div>
                <div className="text-gray-600 leading-relaxed">
                  {[
                    shippingAddress.addressLine1,
                    shippingAddress.addressLine2,
                    shippingAddress.ward,
                    shippingAddress.district,
                    shippingAddress.city
                  ].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price Summary */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Chi tiết thanh toán</h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính</span>
                  <span className="font-medium text-gray-900">{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span className="font-medium text-gray-900">{shippingFee.toLocaleString('vi-VN')}đ</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Giảm giá</span>
                    <span className="font-medium text-green-600">-{discount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold text-gray-900">Tổng cộng</span>
                  <span className="text-lg font-bold text-gray-900">{totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            {userId && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User size={18} className="text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Khách hàng</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên</span>
                    <span className="font-medium text-gray-900">{userId.firstName} {userId.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-gray-900 truncate ml-2">{userId.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SĐT</span>
                    <span className="font-medium text-gray-900">{userId.phone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
