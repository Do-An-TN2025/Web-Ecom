import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";

const formatCurrency = (v = 0) =>
  v.toLocaleString("vi-VN", { minimumFractionDigits: 0 }) + "đ";

export default function Cart() {
  const {
    items,
    updateQty,
    removeItem,
    clearCart,
    totalAmount
  } = useCart();
  const navigate = useNavigate();

  // Coupon (demo)
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const couponDiscountPercent = appliedCoupon?.percent || 0;
  const discountValue = Math.round((totalAmount * couponDiscountPercent) / 100);
  const shippingFee = totalAmount > 498000 || totalAmount === 0 ? 0 : 30000;
  const grandTotal = Math.max(totalAmount - discountValue + shippingFee, 0);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = coupon.trim().toUpperCase();
    setCouponError("");
    if (!code) return;
    // Demo rules
    if (code === "SALE10" && totalAmount >= 200000) {
      setAppliedCoupon({ code, percent: 10 });
    } else if (code === "SALE20" && totalAmount >= 1000000) {
      setAppliedCoupon({ code, percent: 20 });
    } else {
      setAppliedCoupon(null);
      setCouponError("Mã không hợp lệ hoặc chưa đủ điều kiện.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCoupon("");
    setCouponError("");
  };

  const isEmpty = items.length === 0;

  const grouped = useMemo(
    () =>
      items.map((it) => ({
        ...it,
        lineTotal: it.price * it.qty
      })),
    [items]
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Giỏ hàng</h1>

      {isEmpty && (
        <div className="bg-white rounded-xl p-10 shadow-sm text-center border">
          <p className="text-lg font-medium mb-2">Giỏ hàng của bạn đang trống</p>
          <p className="text-gray-500 mb-6 text-sm">
            Hãy khám phá sản phẩm và thêm vào giỏ để bắt đầu.
          </p>
          <Link
            to="/"
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      )}

      {!isEmpty && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT: Items */}
            <div className="lg:col-span-2 space-y-5">
              {grouped.map((it) => (
                <div
                  key={it.key}
                  className="flex flex-col sm:flex-row gap-4 bg-white border rounded-xl p-4 shadow-sm"
                >
                  <div className="w-28 h-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 border">
                    <img
                      src={it.image || "/placeholder.jpg"}
                      alt={it.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between gap-4">
                      <h2 className="font-semibold text-gray-800 line-clamp-2">
                        {it.name}
                      </h2>
                      <button
                        onClick={() => removeItem(it.key)}
                        className="text-gray-400 hover:text-red-500 text-sm"
                        aria-label="Xóa sản phẩm"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-1 text-xs text-gray-500 space-x-3">
                      <span>Màu: {it.color}</span>
                      <span>Size: {it.size}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <div className="flex items-center border rounded-full overflow-hidden">
                        <button
                          onClick={() => updateQty(it.key, it.qty - 1)}
                          disabled={it.qty <= 1}
                          className={`px-3 py-1 text-lg font-medium ${
                            it.qty <= 1
                              ? "text-gray-300 cursor-not-allowed"
                              : "hover:bg-gray-100"
                          }`}
                          aria-label="Giảm số lượng"
                        >
                          −
                        </button>
                        <span className="px-5 py-1 text-sm font-semibold">
                          {it.qty}
                        </span>
                        <button
                          onClick={() => updateQty(it.key, it.qty + 1)}
                          className="px-3 py-1 text-lg font-medium hover:bg-gray-100"
                          aria-label="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>

                      <div className="ml-auto text-right">
                        <p className="text-sm font-bold text-yellow-600">
                          {formatCurrency(it.price)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Tạm tính: {formatCurrency(it.lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-3 justify-between items-center pt-2">
                <Link
                  to="/"
                  className="text-sm text-yellow-600 hover:underline font-medium"
                >
                  ← Tiếp tục mua sắm
                </Link>
                <button
                  onClick={clearCart}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>

          {/* RIGHT: Summary */}
          <aside className="lg:col-span-1">
            <div className="bg-white border rounded-2xl p-6 shadow-sm sticky top-24 space-y-6">
              <h2 className="text-lg font-semibold">Tóm tắt đơn hàng</h2>

              {/* Coupon */}
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mã giảm giá"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg transition"
                  >
                    Áp dụng
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-500 text-xs">{couponError}</p>
                )}
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg">
                    <span className="text-xs font-medium text-yellow-700">
                      Đã áp dụng: {appliedCoupon.code} (−
                      {appliedCoupon.percent}%)
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] text-yellow-600 hover:underline"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </form>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm ({couponDiscountPercent}%)</span>
                    <span>-{formatCurrency(discountValue)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>
                    {shippingFee === 0
                      ? "Miễn phí"
                      : formatCurrency(shippingFee)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between text-base font-semibold">
                  <span>Tổng cộng</span>
                  <span className="text-yellow-600">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  (Đã bao gồm VAT nếu có)
                </p>
              </div>

              <button
                disabled={items.length === 0}
                onClick={() => navigate("/checkout")}
                className={`w-full rounded-xl py-3 font-semibold text-white transition ${
                  items.length
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Thanh toán
              </button>

              <div className="text-[11px] text-gray-500 space-y-1">
                <p>Miễn phí vận chuyển đơn từ 498.000đ.</p>
                <p>Hỗ trợ đổi trả trong 15 ngày.</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}