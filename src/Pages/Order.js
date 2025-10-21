import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function OrderPlacedModal({ orderObj, onClose, onViewDetail, autoCloseMs = 10000 }) {
  const modalRef = useRef(null);
  const closeRef = useRef(null);
  const timerRef = useRef(null);
  const pausedRef = useRef(false);

const formatShippingAddress = (a) => {
  if (!a) return "";
  const parts = [
    a.addressLine1 || a.addressLine || a.address || "",
    a.ward || "",
    a.district || "",
    a.city || "",
  ].map((s) => (s || "").trim()).filter(Boolean);
  return parts.join(", ");
};

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const prevActive = document.activeElement;
    closeRef.current?.focus();

    startTimer();

    return () => {
      clearTimer();
      try { prevActive?.focus?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (!pausedRef.current) onClose();
    }, autoCloseMs);
  };

  // pause/resume helpers (hover or focus inside)
  const handleMouseEnter = () => {
    pausedRef.current = true;
    clearTimer();
  };
  const handleMouseLeave = () => {
    pausedRef.current = false;
    startTimer();
  };

  // keyboard handlers: Escape to close, Tab focus trap
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === "Tab") {
      // simple focus trap
      const focusable = modalRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const items = Array.isArray(orderObj?.items) ? orderObj.items : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onKeyDown={onKeyDown}
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden transform transition-all duration-200"
        style={{ animation: "modalEnter .18s ease-out" }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Đặt hàng thành công</h3>
            <div className="text-sm text-gray-600 mt-1">
              Mã đơn: <strong className="text-gray-800">{orderObj?.orderCode}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Đóng"
              className="p-2 rounded hover:bg-gray-100 text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* body */}
        <div className="p-5 max-h-[65vh] overflow-auto">
          <div className="flex gap-6">
        
            {/* main details */}
            <div className="flex-1">
              <div className="mb-3 text-sm text-gray-700">
                Trạng thái: <strong>{orderObj?.orderStatus ?? "pending"}</strong>
                {" · "}
                Phương thức: <strong>{orderObj?.paymentMethod?.type ?? "COD"}</strong>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium mb-3">Sản phẩm</div>
                <div className="space-y-3">
                  {items.length === 0 && <div className="text-sm text-gray-500">Không có sản phẩm hiển thị</div>}
                  {items.map((it, idx) => {
                    const qty = it.quantity ?? it.qty ?? 1;
                    const price = it.price ?? it.unitPrice ?? 0;
                    const name = it.name ?? it.productName ?? it.title ?? "Sản phẩm";
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={it.image || it.product?.image || "/placeholder.jpg"}
                            alt={name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <div className="text-sm font-medium">{name}</div>
                            <div className="text-xs text-gray-500">Size: {it.size || "-"} · Số lượng: {qty}</div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">{(price || 0).toLocaleString("vi-VN") + "đ"}</div>
                          <div className="text-xs text-gray-400">Tạm: {((price || 0) * qty).toLocaleString("vi-VN") + "đ"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-sm mb-1">
                  <div>Tạm tính</div>
                  <div className="font-medium">{(orderObj?.subtotal ?? 0).toLocaleString("vi-VN") + "đ"}</div>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <div>Giảm</div>
                  <div className="text-green-600 font-medium">-{(orderObj?.discount ?? orderObj?.voucher?.discountAmount ?? 0).toLocaleString("vi-VN") + "đ"}</div>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <div>Phí vận chuyển</div>
                  <div>{(orderObj?.shippingFee ?? 0).toLocaleString("vi-VN") + "đ"}</div>
                </div>
                <div className="flex justify-between mt-2 text-lg font-semibold">
                  <div>Tổng cộng</div>
                  <div className="text-yellow-600">{(orderObj?.totalAmount ?? 0).toLocaleString("vi-VN") + "đ"}</div>
                </div>
              </div>

               {orderObj?.shippingAddress && (
                <div className="mt-4 text-sm">
                  <div className="font-medium mb-1">Giao đến</div>
                  <div className="text-gray-800">
                    {orderObj.shippingAddress.fullName}
                    {orderObj.shippingAddress.phone && <> · {orderObj.shippingAddress.phone}</>}
                  </div>

                  {/* show email if present */}
                  {orderObj.shippingAddress.email && (
                    <div className="text-gray-600 text-sm">{orderObj.shippingAddress.email}</div>
                  )}

                  {/* formatted full address */}
                  <div className="text-gray-600 text-sm mt-1">
                    {formatShippingAddress(orderObj.shippingAddress) || "Chưa có địa chỉ chi tiết"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">Thông báo sẽ tự đóng sau {Math.round(autoCloseMs/1000)} giây</div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded border text-sm">Đóng</button>
            <button onClick={onViewDetail} className="px-3 py-2 rounded bg-yellow-500 text-white">Xem chi tiết</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalEnter {
          from { opacity: 0; transform: translateY(-8px) scale(.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function Order() {
  const loc = useLocation();
  const navigate = useNavigate();

  const [placedOrder, setPlacedOrder] = useState(loc.state?.order || null);
  const [justPlaced, setJustPlaced] = useState(!!loc.state?.justPlaced);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!placedOrder) {
      try {
        const raw = localStorage.getItem("lastOrder");
        const code = localStorage.getItem("lastOrderCode");
        if (raw) {
          setPlacedOrder(JSON.parse(raw));
          setJustPlaced(true);
        } else if (code) {
          setLoading(true);
          fetch(`/api/orders/check-payment/${code}`)
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((data) => {
              setPlacedOrder({ ...data, orderCode: data.orderCode || code });
              setJustPlaced(true);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        }
      } catch (e) {}
    }

    // keep lastOrderCode for lookup but remove lastOrder payload to avoid repeated modals
    try {
      localStorage.removeItem("lastOrder");
    } catch (e) {}
  }, [placedOrder]);

  const orderObj = placedOrder?.order ? placedOrder.order : placedOrder || null;

  const closeModal = () => {
    setJustPlaced(false);
    setPlacedOrder(null);
    try {
      localStorage.removeItem("lastOrder");
      localStorage.removeItem("lastOrderCode");
    } catch (e) {}
    // keep user on /orders page, replace state so modal won't re-open
    navigate("/orders", { replace: true, state: {} });
  };

  const viewDetail = () => {
    const code = orderObj?.orderCode || placedOrder?.orderCode;
    if (code) navigate(`/orders/${code}`);
    else navigate("/orders");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {justPlaced && orderObj && (
        <OrderPlacedModal
          orderObj={orderObj}
          onClose={closeModal}
          onViewDetail={viewDetail}
          autoCloseMs={5000}
        />
      )}

      {loading && <div>Đang tải thông tin đơn...</div>}

      <h1 className="text-2xl font-bold mb-4">Đơn hàng của bạn</h1>
      <div>
        <p className="text-sm text-gray-500">Danh sách đơn hàng sẽ hiển thị ở đây.</p>
      </div>
    </div>
  );
}