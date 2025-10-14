import React, { useMemo, useRef, useState } from "react";
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
  { id: "cod", label: "Thanh toán khi nhận hàng (COD)", hint: "Thanh toán trực tiếp", iconUrl: ICONS.cod },
  { id: "payos", label: "Ví / Thẻ (PayOS)", hint: "Thẻ, QR, ví", iconUrl: ICONS.payos },
  { id: "momo", label: "Ví Momo", hint: "Ví Momo", iconUrl: ICONS.momo },
  { id: "vnpay", label: "VNPAY", hint: "Ví VNPAY", iconUrl: ICONS.vnpay },
];

const formatCurrency = (v = 0) => v.toLocaleString("vi-VN", { minimumFractionDigits: 0 }) + "đ";

export default function CheckoutPage() {
  const { items } = useCart();
  const navigate = useNavigate();

  const shippingRef = useRef(null);
  const [shippingState, setShippingState] = useState({}); // mirror of shipping form for UI if needed

  // payment & coupon UI
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [openCouponModal, setOpenCouponModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0].id);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(paymentOptions[0]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

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
      return;
    }
    if (c === "SALE20" && subtotal >= 1000000) {
      setAppliedCoupon({ code: c, percent: 20 });
      return;
    }
    setAppliedCoupon(null);
    alert("Mã không hợp lệ hoặc chưa đủ điều kiện.");
  };

  const handlePlaceOrder = async () => {
    const result = await shippingRef.current?.validateAndGet();
    if (!result || !result.valid) return;
    const ship = result.data;

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
        addressLine1: ship.addressLine1,
        addressId: ship.addressId,
      },
      paymentMethod: { type: paymentMethod },
      shippingFee,
      discount: discountValue || 0,
      totalAmount: grandTotal,
      customerNote: ship.note || "",
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("create order failed", err);
        alert(err.message || "Tạo đơn hàng thất bại");
        return;
      }
      const data = await res.json();
      const checkoutUrl = data?.payment?.checkoutUrl || data?.paymentLink;
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }
      navigate("/orders");
    } catch (e) {
      console.error(e);
      alert("Lỗi khi tạo đơn hàng");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
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

              <button onClick={handlePlaceOrder} className="mt-2 w-full rounded-full py-3 font-semibold text-white bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center gap-2">
                <span>Đặt hàng</span>
                <span className="text-sm">→</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

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