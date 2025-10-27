import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import orderService from "../../services/orderService";

export default function OrdersList({ orders = [], onRefresh = () => {} }) {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState(null);
  const token = (() => { try { return localStorage.getItem("token"); } catch { return null; } })();

  const handleView = (order) => {
    navigate(`/orders/${order.orderCode || order._id}`);
  };

  const handleCheckPayment = async (order) => {
    if (!order?.orderCode) return alert("Không có mã đơn để kiểm tra");
    setLoadingId(order._id);
    try {
      const data = await orderService.checkPaymentStatus(order.orderCode, token);
      alert(`Trạng thái: ${data.paymentStatus || data.orderStatus || "unknown"}`);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert(err.message || "Lỗi khi kiểm tra thanh toán");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async (order) => {
    if (!order?._id) return;
    if (!window.confirm("Bạn có chắc muốn hủy đơn này?")) return;
    setLoadingId(order._id);
    try {
      await orderService.cancelOrder(order._id, token);
      alert("Đã hủy đơn");
      onRefresh();
    } catch (err) {
      console.error(err);
      alert(err.message || "Lỗi khi hủy đơn");
    } finally {
      setLoadingId(null);
    }
  };

  if (!Array.isArray(orders) || orders.length === 0) {
    return <div className="p-6 bg-white rounded shadow text-sm text-gray-600">Không có đơn hàng.</div>;
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => {
        const status = o.orderStatus || o.paymentMethod?.status || "pending";
        const canCheckPayment = !!o.orderCode && String(status).toLowerCase() !== "paid";
        const canCancel = String(status).toLowerCase() === "pending" && String(o.paymentMethod?.status || "").toLowerCase() !== "paid";
        return (
          <div key={o._id || o.orderCode} className="bg-white p-4 rounded shadow flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Mã đơn</div>
              <div className="font-medium">{o.orderCode}</div>
              <div className="text-xs text-gray-500 mt-1">{(o.items?.length || 0)} sản phẩm · {(o.totalAmount || 0).toLocaleString()}đ</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Trạng thái</div>
              <div className="font-semibold">{status}</div>
              <div className="mt-3 flex gap-2 justify-end">
                <button onClick={() => handleView(o)} className="px-3 py-1 rounded border text-sm">Xem</button>
                {canCheckPayment && (
                  <button onClick={() => handleCheckPayment(o)} disabled={loadingId === o._id} className="px-3 py-1 rounded border text-sm">
                    {loadingId === o._id ? "Đang..." : "Kiểm tra thanh toán"}
                  </button>
                )}
                {canCancel && (
                  <button onClick={() => handleCancel(o)} disabled={loadingId === o._id} className="px-3 py-1 rounded bg-red-50 text-red-600 text-sm border">
                    {loadingId === o._id ? "Đang..." : "Hủy đơn"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}