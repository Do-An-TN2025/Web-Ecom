import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import PaymentModal from "./Checkout/PaymentModal";
import CouponModal from "./Checkout/CouponModal";
import ShippingForm from "./Checkout/ShippingForm";

const ICONS = {
  cod: "https://buggy.yodycdn.com/images/assets/method_cod.webp",
  payos: "https://buggy.yodycdn.com/images/assets/method_zalopay.webp",
  momo: "https://buggy.yodycdn.com/images/assets/method_momo.webp",
  vnpay: "https://buggy.yodycdn.com/images/assets/method_vnpay.webp",
};

const paymentOptions = [
  { id: "COD", label: "Thanh toán khi nhận hàng (COD)", hint: "Thanh toán trực tiếp", iconUrl: ICONS.cod },
  { id: "PayOS", label: "Ví / Thẻ (PayOS)", hint: "Thẻ, QR, ví", iconUrl: ICONS.payos },
  { id: "momo", label: "Ví Momo", hint: "Ví Momo", iconUrl: ICONS.momo },
  { id: "vnpay", label: "VNPAY", hint: "Ví VNPAY", iconUrl: ICONS.vnpay },
];

const formatCurrency = (v = 0) => (Number(v) || 0).toLocaleString("vi-VN", { minimumFractionDigits: 0 }) + "đ";

// read API base from env (remove trailing slash)
const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8686/api").replace(/\/$/, "");

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();

  const shippingRef = useRef(null);
  const [shippingState, setShippingState] = useState({});

  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [openCouponModal, setOpenCouponModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0].id);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(paymentOptions[0]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [voucherCode, setVoucherCode] = useState(null);

  // loading / success states
  const [isPlacing, setIsPlacing] = useState(false);
  const loadingStartRef = useRef(0);
  const MIN_LOADING_MS = 1200; // minimum spinner visible time (ms)

  const [showSuccess, setShowSuccess] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  // QR code / polling states
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrPayload, setQrPayload] = useState(null);
  const [qrPolling, setQrPolling] = useState(false);
  const qrPollRef = useRef(null);

  // totals
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (it.finalPrice ?? it.price ?? 0) * (it.qty ?? it.quantity ?? 1), 0),
    [items]
  );
  const shippingFee = subtotal === 0 || subtotal > 498000 ? 0 : 30000;
  const couponDiscountPercent = appliedCoupon?.percent || 0;
  const discountValue = Math.round((subtotal * couponDiscountPercent) / 100);
  const grandTotal = Math.max(subtotal - discountValue + shippingFee, 0);

  const handleApplyCoupon = (code) => {
    const c = code?.trim()?.toUpperCase();
    if (!c) return;
    if (c === "SALE10" && subtotal >= 200000) {
      setAppliedCoupon({ code: c, percent: 10 });
      setVoucherCode(c);
      return;
    }
    if (c === "SALE20" && subtotal >= 1000000) {
      setAppliedCoupon({ code: c, percent: 20 });
      setVoucherCode(c);
      return;
    }
    setAppliedCoupon(null);
    setVoucherCode(null);
    alert("Mã không hợp lệ hoặc chưa đủ điều kiện.");
  };

  const getAuthToken = () => {
    try {
      return localStorage.getItem("token") || null;
    } catch (e) {
      return null;
    }
  };

  const normalizePaymentType = (type) => {
    if (!type) return type;
    if (typeof type !== "string") return type;
    return type.toLowerCase() === "payos" ? "PayOS" : type;
  };

  // loading helpers: ensure spinner shows at least MIN_LOADING_MS
  const startLoading = () => {
    loadingStartRef.current = Date.now();
    setIsPlacing(true);
  };
  const finishLoading = async () => {
    const elapsed = Date.now() - (loadingStartRef.current || 0);
    const remain = MIN_LOADING_MS - elapsed;
    if (remain > 0) await new Promise((r) => setTimeout(r, remain));
    setIsPlacing(false);
  };

  // try both possible backend endpoints (check-payment or payment-status)
  const checkPaymentOnce = async (orderCode) => {
    if (!orderCode) return null;
    const endpoints = [
      `${API_URL}/orders/check-payment/${orderCode}`,
      `${API_URL}/orders/payment-status/${orderCode}`,
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        // normalize returned status fields if necessary
        return data;
      } catch (err) {
        // try next
        console.error("checkPaymentOnce error for", url, err);
      }
    }
    return null;
  };

  const startQrPolling = (orderCode, intervalMs = 5000, timeoutMs = 120000) => {
    if (!orderCode) return;
    if (qrPollRef.current) {
      clearInterval(qrPollRef.current);
      qrPollRef.current = null;
    }
    setQrPolling(true);
    const startedAt = Date.now();
    qrPollRef.current = setInterval(async () => {
      try {
        const s = await checkPaymentOnce(orderCode);
        // support different response shapes: check s.paymentStatus, s.order?.payment?.status, s.payment?.status
        const status =
          s?.paymentStatus ||
          s?.order?.paymentMethod?.status ||
          s?.payment?.status ||
          s?.order?.payment?.status ||
          s?.orderStatus;
        if (status && String(status).toLowerCase() === "paid") {
          clearInterval(qrPollRef.current);
          qrPollRef.current = null;
          setQrPolling(false);
          setShowQRModal(false);
          // finalize: clear cart, save last order and show success
          try {
            localStorage.setItem("lastOrderCode", orderCode);
          } catch (e) {}
          try {
            localStorage.setItem("lastOrder", JSON.stringify(s));
          } catch (e) {}
          try {
            if (typeof clearCart === "function") clearCart();
            else localStorage.removeItem("cart");
          } catch {}
          setSuccessOrder(s);
          setShowSuccess(true);
          setTimeout(() => setShowChoiceModal(true), 250);
        } else {
          if (Date.now() - startedAt > timeoutMs) {
            clearInterval(qrPollRef.current);
            qrPollRef.current = null;
            setQrPolling(false);
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, intervalMs);
  };

  useEffect(() => {
    return () => {
      if (qrPollRef.current) {
        clearInterval(qrPollRef.current);
        qrPollRef.current = null;
      }
    };
  }, []);

  const handlePlaceOrder = async () => {
    const result = await shippingRef.current?.validateAndGet();
    if (!result || !result.valid) return;
    const ship = result.data;

    startLoading();
    const token = getAuthToken();
    const isLoggedIn = !!token;

    const payload = {
      items: items.map((it) => ({
        productId: it.productId,
        variantId: it.variantId,
        size: it.size,
        quantity: it.qty ?? it.quantity ?? 1,
        price: it.finalPrice ?? it.price ?? 0,
        name: it.name,
      })),
      shippingAddress: {
        fullName: ship.fullName,
        email: ship.email,
        phone: ship.phone,
        addressLine1: ship.addressLine1 || ship.addressLine || "",
        ward: ship.ward || "",
        district: ship.district || "",
        city: ship.city || "",
      },
      paymentMethod: { type: normalizePaymentType(paymentMethod), note: paymentMethod === "COD" ? "" : "Thanh toán online" },
      shippingFee,
      discount: discountValue || 0,
      totalAmount: grandTotal,
      customerNote: ship.note || "",
      voucherCode: voucherCode || null,
      ...(isLoggedIn ? {} : { guestInfo: { fullName: ship.fullName, phone: ship.phone, email: ship.email || null } }),
    };

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/orders/create-orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("create order failed", err);
        alert(err.message || "Tạo đơn hàng thất bại");
        await finishLoading();
        return;
      }

      const data = await res.json();
      const checkoutUrl = data?.payment?.checkoutUrl || data?.paymentLink || data?.paymentUrl;
      const qrCode = data?.payment?.qrCode || data?.payment?.qr || data?.payment?.qrPayload || null;
      const order = data?.order || null;
      const orderCode = order?.orderCode || data?.orderCode || null;

      if (orderCode) {
        try { localStorage.setItem("lastOrderCode", orderCode); } catch (e) {}
        try { localStorage.setItem("lastOrder", JSON.stringify(order || data)) } catch (e) {}
      }

      // If payment provider returns a checkoutUrl -> redirect (PayOS web flow)
      if (checkoutUrl && !qrCode) {
        await finishLoading();
        window.location.assign(checkoutUrl);
        return;
      }

      // If provider returned a QR payload -> render QR on frontend and let user scan
      if (qrCode) {
        setQrPayload(qrCode);
        setShowQRModal(true);
        if (orderCode) startQrPolling(orderCode);
        await finishLoading();
        return;
      }

      // COD / offline success flow (no redirect, no QR)
      try {
        if (typeof clearCart === "function") {
          clearCart();
        } else {
          localStorage.removeItem("cart");
        }
      } catch {}

      await finishLoading(); // keep spinner visible at least MIN_LOADING_MS
      // show success screen and choice modal
      setSuccessOrder(order || data);
      setShowSuccess(true);
      setTimeout(() => setShowChoiceModal(true), 250);
    } catch (e) {
      console.error("handlePlaceOrder error", e);
      alert("Lỗi khi tạo đơn hàng");
      await finishLoading();
    }
  };

  const handleManualCheck = async () => {
    const code = successOrder?.orderCode || localStorage.getItem("lastOrderCode");
    const codeToCheck = code || (successOrder && successOrder.orderCode ? successOrder.orderCode : null);
    if (!codeToCheck) {
      alert("Không có mã đơn để kiểm tra");
      return;
    }
    startLoading();
    try {
      const s = await checkPaymentOnce(codeToCheck);
      const status =
        s?.paymentStatus ||
        s?.order?.paymentMethod?.status ||
        s?.payment?.status ||
        s?.order?.payment?.status ||
        s?.orderStatus;
      if (status && String(status).toLowerCase() === "paid") {
        try { localStorage.setItem("lastOrder", JSON.stringify(s)) } catch (e) {}
        try {
          if (typeof clearCart === "function") clearCart();
          else localStorage.removeItem("cart");
        } catch {}
        setSuccessOrder(s);
        setShowSuccess(true);
        setTimeout(() => setShowChoiceModal(true), 250);
        setShowQRModal(false);
      } else {
        alert("Chưa thanh toán. Vui lòng thử lại sau.");
      }
    } catch (err) {
      console.error("manual check error", err);
      alert("Lỗi khi kiểm tra thanh toán");
    } finally {
      await finishLoading();
    }
  };

  const handleViewOrder = () => {
    const code = successOrder?.orderCode || successOrder?.order?.orderCode || localStorage.getItem("lastOrderCode");
    if (code) navigate(`/orders/${code}`);
    else navigate("/orders");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const closeSuccess = () => {
    setShowChoiceModal(false);
    setShowSuccess(false);
    setSuccessOrder(null);
    navigate("/orders", { state: { justPlaced: true, order: successOrder } });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      {/* Loading overlay */}
      {isPlacing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white/95 rounded-lg p-6 flex flex-col items-center gap-3">
            {/* slower spinner: override animationDuration */}
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" style={{ animationDuration: "1.5s" }} />
            <div className="text-sm font-medium">Đang xử lý đơn hàng...</div>
          </div>
        </div>
      )}

      {/* QR modal (PayOS QR) */}
      {showQRModal && qrPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQRModal(false)} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
            <h3 className="text-lg font-semibold mb-3">Quét mã QR để thanh toán</h3>
            <div className="mb-4">
              {/* Use external QR generation service to render payload */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrPayload)}`}
                alt="Pay QR"
                className="mx-auto"
              />
            </div>
            <div className="text-sm text-gray-600 mb-4">Quét mã bằng ứng dụng ngân hàng hoặc ví để thanh toán.</div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleManualCheck}
                className="px-4 py-2 rounded-full border text-sm hover:bg-gray-50"
                disabled={qrPolling}
              >
                {qrPolling ? "Đang kiểm tra..." : "Kiểm tra thanh toán"}
              </button>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  if (qrPollRef.current) { clearInterval(qrPollRef.current); qrPollRef.current = null; setQrPolling(false); }
                }}
                className="px-4 py-2 rounded-full bg-yellow-500 text-white text-sm hover:bg-yellow-600"
              >
                Đóng
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-400">Bạn có thể làm mới hoặc chờ hệ thống cập nhật tự động.</div>
          </div>
        </div>
      )}

      {/* Success full-screen card (like screenshot) */}
      {showSuccess && successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 p-6">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" className="mx-auto">
                <circle cx="12" cy="12" r="11" stroke="#10B981" strokeWidth="1.5" fill="#ECFDF5" />
                <path d="M7.5 12.5l2 2 6-6" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold mb-2">MUA HÀNG THÀNH CÔNG</h3>
            <p className="text-sm text-gray-600 mb-6">
              Đơn hàng <strong className="text-gray-800">{successOrder?.orderCode || successOrder?.order?.orderCode}</strong> của bạn đã được tiếp nhận.
              Nhân viên sẽ xử lý và giao trong thời gian sớm nhất.
            </p>

            <div className="flex items-center justify-center gap-4">
              <button onClick={handleViewOrder} className="px-6 py-2 rounded-full border text-sm font-medium hover:bg-gray-50">
                XEM ĐƠN HÀNG
              </button>
              <button onClick={handleGoHome} className="px-6 py-2 rounded-full bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600">
                TRANG CHỦ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main checkout UI (hidden when full success shown) */}
      {!showSuccess && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-8 space-y-6">
            <ShippingForm ref={shippingRef} onChange={setShippingState} />

            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Chi tiết đơn hàng</h3>
              <ul className="space-y-4">
                {items.length === 0 && <li className="text-sm text-gray-500">Giỏ hàng trống</li>}
                {items.map((it) => {
                  const qty = it.qty ?? it.quantity ?? 1;
                  const price = it.finalPrice ?? it.price ?? 0;
                  return (
                    <li key={it.key || it._id || `${it.productId}-${it.variantId}-${it.size}`} className="flex items-center gap-4">
                      <img src={it.image || "/placeholder.jpg"} alt={it.name || "sp"} className="w-20 h-20 object-cover rounded-lg border" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-2">{it.name || it.product?.title}</div>
                        <div className="text-xs text-gray-500 mt-1">Size: {it.size || "-"} · Số lượng: {qty}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-yellow-600">{formatCurrency(price)}</div>
                        <div className="text-xs text-gray-400">Tạm tính: {formatCurrency(price * qty)}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* RIGHT */}
          <aside className="lg:col-span-4">
            <div className="bg-white border rounded-2xl p-6 shadow-sm sticky top-24 space-y-6">
              <div className="space-y-3">
                <button onClick={() => setOpenCouponModal(true)} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border hover:shadow-sm bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">🏷️</div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-800">Chọn khuyến mãi</div>
                      <div className="text-xs text-gray-400">Áp mã giảm giá hoặc khuyến mãi</div>
                    </div>
                  </div>
                  <div className="text-gray-400">›</div>
                </button>

                <button onClick={() => setOpenPaymentModal(true)} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border hover:shadow-sm bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                      {selectedPaymentOption?.iconUrl ? <img src={selectedPaymentOption.iconUrl} alt={selectedPaymentOption.id} className="w-7 h-7 object-contain" /> : <div className="w-7 h-7 flex items-center justify-center text-gray-700">💳</div>}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-800">{selectedPaymentOption?.label || paymentMethod}</div>
                      <div className="text-xs text-gray-400">Chọn phương thức thanh toán</div>
                    </div>
                  </div>
                  <div className="text-gray-400">›</div>
                </button>
              </div>

              <div className="border-t pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {discountValue > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm ({couponDiscountPercent}%)</span>
                    <span>-{formatCurrency(discountValue)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span className="text-gray-600">{shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee)}</span>
                </div>
                <hr />
                <div className="flex justify-between items-end text-lg font-semibold">
                  <span className="text-base">Tổng cộng</span>
                  <span className="text-yellow-600 text-xl">{formatCurrency(grandTotal)}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacing || items.length === 0}
                  aria-busy={isPlacing}
                  className={
                    "mt-2 w-full rounded-full py-3 font-semibold text-white bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center gap-2 " +
                    (isPlacing ? "opacity-70 cursor-not-allowed" : "")
                  }
                >
                  <span>{isPlacing ? "Đang xử lý..." : "Đặt hàng"}</span>
                  <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <PaymentModal
        open={openPaymentModal}
        onClose={() => setOpenPaymentModal(false)}
        selected={paymentMethod}
        options={paymentOptions}
        onConfirm={(opt) => {
          setPaymentMethod(opt.id);
          setSelectedPaymentOption(opt);
          setOpenPaymentModal(false);
        }}
      />

      <CouponModal open={openCouponModal} onClose={() => setOpenCouponModal(false)} subtotal={subtotal} onApply={(code) => handleApplyCoupon(code)} />
    </div>
  );
}