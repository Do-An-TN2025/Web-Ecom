import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OrdersList from "../components/Order/OrdersList";
import orderService from "../services/orderService";

function OrderSuccessCard({ order, onClose, onView }) {
  if (!order) return null;
  const pay = order.payment || order.paymentMethod || {};
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 flex items-center justify-center bg-green-50 rounded-full">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M7 12l3 3 7-7" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold">Đặt hàng thành công</h3>
          <p className="text-sm text-gray-600 mt-1">
            Mã đơn: <strong className="text-gray-800">{order.orderCode}</strong>
          </p>

          <div className="mt-3 text-sm text-gray-700">
            <div>Tổng: {(order.totalAmount || order.total || 0).toLocaleString()}đ</div>
            <div>Trạng thái: {(pay.status || order.orderStatus || "pending").toString()}</div>
            <div>Người nhận: {order.shippingAddress?.fullName} · {order.shippingAddress?.phone}</div>
            <div className="text-xs text-gray-400 mt-1">Nếu bạn muốn kiểm tra thanh toán, bấm "Xem đơn".</div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={() => onView(order.orderCode)} className="px-4 py-2 rounded border text-sm">Xem đơn</button>
            { (pay.checkoutUrl || pay.invoiceUrl) && (
              <button onClick={() => window.location.href = pay.checkoutUrl || pay.invoiceUrl} className="px-4 py-2 rounded bg-yellow-500 text-white text-sm">Mở trang thanh toán</button>
            )}
            <button onClick={onClose} className="px-4 py-2 rounded border text-sm">Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSearch({ onResult }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const doSearch = async (code) => {
    const orderCode = (code || q || "").trim();
    if (!orderCode) return alert("Nhập mã đơn");
    setLoading(true);
    try {
      const data = await orderService.checkPaymentStatus(orderCode);
      onResult(null, data);
    } catch (err) {
      onResult(err || new Error("Không tìm thấy đơn"), null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 p-4 bg-white rounded shadow flex gap-2 items-center">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && doSearch()}
        placeholder="Nhập mã đơn để tra cứu (ví dụ: 278807845)"
        className="flex-1 border rounded px-3 py-2"
      />
      <button onClick={() => doSearch()} disabled={loading} className="px-4 py-2 rounded bg-yellow-500 text-white">
        {loading ? "Đang..." : "Tra cứu"}
      </button>
    </div>
  );
}

export default function Order() {
  const navigate = useNavigate();
  const [lastOrder, setLastOrder] = useState(null);
  const [lastOrderCode, setLastOrderCode] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [orders, setOrders] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const token = (() => { try { return localStorage.getItem("auth_token"); } catch { return null; } })();
  const isLoggedIn = !!token;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastOrder");
      const code = localStorage.getItem("lastOrderCode");
      if (raw) setLastOrder(JSON.parse(raw));
      if (code) setLastOrderCode(code);
    } catch (e) {
      setLastOrder(null);
      setLastOrderCode(null);
    }

    let mounted = true;
    const loadOrders = async () => {
      if (!isLoggedIn) return;
      setLoadingOrders(true);
      try {
        const data = await orderService.getMyOrders(token);
        if (!mounted) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setOrders([]);
      } finally {
        if (mounted) setLoadingOrders(false);
      }
    };
    loadOrders();
    return () => { mounted = false; };
  }, [isLoggedIn, token]);

  const handleSearchResult = (err, data) => {
    if (err) {
      setSearchError(err.message || "Không tìm thấy đơn");
      setSearchResult(null);
      return;
    }
    setSearchError(null);
    setSearchResult(data);
  };

  const handleViewOrder = (code) => {
    if (!code) return;
    navigate(`/orders/${code}`);
  };

  const clearLastOrder = () => {
    try { localStorage.removeItem("lastOrder"); localStorage.removeItem("lastOrderCode"); } catch (e) {}
    setLastOrder(null);
    setLastOrderCode(null);
  };

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <div>
          <button onClick={() => navigate("/")} className="px-3 py-2 rounded border">Trang chủ</button>
        </div>
      </div>

      {/* If the user just placed an order show success card */}
      {lastOrder && (
        <div className="mb-4">
          <OrderSuccessCard order={lastOrder} onClose={clearLastOrder} onView={handleViewOrder} />
        </div>
      )}

      {/* Search box: show for guests only (logged-in users see their list below) */}
      {!isLoggedIn && <OrderSearch onResult={handleSearchResult} />}

      {/* Search result */}
      {searchError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{searchError}</div>}
      {searchResult && (
        <div className="mb-4 p-4 bg-white rounded shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Mã đơn</div>
              <div className="font-medium">{searchResult.orderCode}</div>
              <div className="text-xs text-gray-500">Tổng: {(searchResult.totalAmount || 0).toLocaleString()}đ</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Trạng thái</div>
              <div className="font-semibold">{(searchResult.paymentStatus || searchResult.orderStatus || "pending").toString()}</div>
              <div className="mt-3 flex gap-2 justify-end">
                <button onClick={() => handleViewOrder(searchResult.orderCode)} className="px-3 py-1 rounded border text-sm">Xem chi tiết</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logged-in user's orders list */}
      {isLoggedIn ? (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Đơn hàng của tôi</h2>
            {loadingOrders ? (
              <div className="p-4 bg-white rounded shadow">Đang tải...</div>
            ) : (
              <OrdersList
                orders={orders || []}
                onRefresh={async () => {
                  setLoadingOrders(true);
                  try {
                    const data = await orderService.getMyOrders(token);
                    setOrders(Array.isArray(data) ? data : []);
                  } catch (e) {
                    setOrders([]);
                  }
                  setLoadingOrders(false);
                }}
              />
            )}
          </div>
        </>
      ) : (
        <div className="p-4 bg-white rounded shadow text-sm text-gray-600">
          Nếu bạn chưa đăng nhập, có thể tra cứu đơn bằng mã ở ô trên. Đăng nhập để xem lịch sử đơn hàng đầy đủ.
        </div>
      )}
    </div>
  );
}