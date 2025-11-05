import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";

const formatCurrency = (v = 0) =>
  v.toLocaleString("vi-VN", { minimumFractionDigits: 0 }) + "đ";

function RoundCheckbox({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!checked}
      aria-label={ariaLabel}
      onClick={() => onChange && onChange(!checked)}
      className={`flex items-center justify-center w-5 h-5 rounded-full transition-all border ${
        checked ? "bg-yellow-500 border-yellow-500" : "bg-white border-gray-300"
      } focus:outline-none focus:ring-2 focus:ring-yellow-300`}
    >
      {checked && (
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.666 1L4.166 8L1 4.666" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

export default function Cart() {
  const { items, updateQty, removeItem, decrementItem, clearCart, totalAmount } = useCart();
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

  // normalize items so the UI code can be simple regardless of API shape
  const normalized = useMemo(() => {
    return items.map((it) => {
      // Prefer database-backed _id when available. Falling back to key or composed id only as last resort.
      const id = it._id || it.key || it.id || `${it.productId}-${it.variantId}-${it.size}`;
      const qty = Number(it.qty ?? it.quantity ?? 0);
      const price = Number(it.finalPrice ?? it.discountPrice ?? it.price ?? 0);
      const img =
        it.image ||
        (it.variant && (Array.isArray(it.variant.images) ? it.variant.images[0] : it.variant.images)) ||
        (it.product && it.product.thumbnail) ||
        "/placeholder.jpg";
      const name = it.name || it.product?.name || it.product?.title || "";
      console.log("names", name);
      const color = it.color || it.variant?.color || "";
      const size = it.size || it.variant?.sizeInfo?.size || "";
      return {
        ...it,
        id,
        qty,
        price,
        image: img,
        name,
        color,
        size,
        lineTotal: price * qty
      };
    });
  }, [items]);

  // selection state (default: select all)
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    // select all when items change
    const ids = normalized.map(it => it.id);
    setSelectedIds(new Set(ids));
  }, [normalized]);

  const allSelected = normalized.length > 0 && normalized.every(it => selectedIds.has(it.id));

  const toggleSelect = (idOrBool) => {
    // if idOrBool is boolean => toggle all
    if (typeof idOrBool === "boolean") {
      if (idOrBool) setSelectedIds(new Set(normalized.map(it => it.id)));
      else setSelectedIds(new Set());
      return;
    }
    const id = idOrBool;
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  // calculate selected totals
  const selectedItems = useMemo(() => normalized.filter(it => selectedIds.has(it.id)), [normalized, selectedIds]);
  const selectedCount = selectedItems.length;
  const selectedSubtotal = selectedItems.reduce((s, it) => s + (it.lineTotal || 0), 0);
  const selectedShipping = selectedSubtotal === 0 || selectedSubtotal > 498000 ? 0 : 30000;
  const selectedGrand = Math.max(selectedSubtotal - Math.round((selectedSubtotal * couponDiscountPercent) / 100) + selectedShipping, 0);

  const handleCheckout = () => {
    if (selectedCount === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán.");
      return;
    }
    const ok = window.confirm(`Bạn sẽ thanh toán ${selectedCount} sản phẩm. Tiếp tục?`);
    if (!ok) return;
    navigate("/checkout", { state: { items: selectedItems } });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Giỏ hàng</h1>

      {isEmpty && (
        <div className="bg-white rounded-xl p-6 shadow-sm text-center border">
          <p className="text-lg font-medium mb-2">Giỏ hàng của bạn đang trống</p>
          <p className="text-gray-500 mb-4 text-sm">
            Hãy khám phá sản phẩm và thêm vào giỏ để bắt đầu.
          </p>
          <Link 
            to="/"
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-5 py-2 rounded-lg transition"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      )}

      {!isEmpty && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            {/* LEFT: Items (responsive stacked on mobile) */}
            <div className="lg:col-span-2 order-1 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <RoundCheckbox checked={allSelected} onChange={() => toggleSelect(!allSelected)} ariaLabel="Chọn tất cả" />
                  <span className="text-sm">Chọn tất cả</span>
                </div>
                <Link
                  to="/"
                  className="text-sm text-yellow-600 hover:underline font-medium"
                >
                  ← Tiếp tục mua sắm
                </Link>
              </div>

              {normalized.map((it) => (
                <div
                  key={it.id}
                  className="flex flex-col md:flex-row gap-3 bg-white border rounded-xl p-3 sm:p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <RoundCheckbox checked={selectedIds.has(it.id)} onChange={() => toggleSelect(it.id)} ariaLabel={`Chọn ${it.name}`} />
                  </div>

                  <div className="flex-shrink-0 w-full md:w-28 h-28 md:h-28 rounded-lg bg-gray-100 border overflow-hidden flex items-center justify-center">
                    <img
                      src={it.image}
                      alt={it.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-start gap-3">
                      <h2 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-2">
                        {it.name}
                      </h2>
                      <button
                        onClick={() => removeItem(it.id)}
                        className="text-gray-400 hover:text-red-500 text-base ml-2"
                        aria-label="Xóa sản phẩm"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-1 text-xs text-gray-500 space-x-3">
                      <span className="inline-block">Màu: {it.color || '-'}</span>
                      <span className="inline-block">Size: {it.size || '-'}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border rounded-full overflow-hidden">
                        <button
                          onClick={() => decrementItem(it.id)}
                          className={`px-3 py-1 sm:px-4 sm:py-2 text-lg font-medium hover:bg-gray-100`}
                          aria-label="Giảm số lượng"
                        >
                          −
                        </button>
                        <span className="px-4 py-1 text-sm sm:px-6 sm:py-2 font-semibold">
                          {it.qty}
                        </span>
                        <button
                          onClick={() => updateQty(it.id, it.qty + 1)}
                          className="px-3 py-1 sm:px-4 sm:py-2 text-lg font-medium hover:bg-gray-100"
                          aria-label="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>

                      <div className="ml-auto text-right">
                        <p className="text-sm sm:text-base font-bold text-yellow-600">
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

              <div className="flex items-center justify-between mt-2">
                <div />
                <button
                  onClick={() => clearCart()}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>

            {/* RIGHT: Summary (visible as sidebar on lg, below items on mobile) */}
            <aside className="lg:col-span-1 order-2">
              <div className="hidden lg:block bg-white border rounded-2xl p-6 shadow-sm sticky top-24 space-y-6">
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
                      className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold rounded-lg transition"
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
                    <span>Tạm tính (đã chọn)</span>
                    <span>{formatCurrency(selectedSubtotal)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm ({couponDiscountPercent}%)</span>
                      <span>-{formatCurrency(Math.round((selectedSubtotal * couponDiscountPercent) / 100))}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span>
                      {selectedShipping === 0 ? "Miễn phí" : formatCurrency(selectedShipping)}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Tổng cộng</span>
                    <span className="text-yellow-600">{formatCurrency(selectedGrand)}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">(Đã bao gồm VAT nếu có)</p>
                </div>

                <button
                  disabled={selectedCount === 0}
                  onClick={handleCheckout}
                  className={`w-full rounded-xl py-3 font-semibold text-white transition ${
                    selectedCount ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  Thanh toán ({selectedCount})
                </button>

                <div className="text-[11px] text-gray-500 space-y-1">
                  <p>Miễn phí vận chuyển đơn từ 498.000đ.</p>
                  <p>Hỗ trợ đổi trả trong 15 ngày.</p>
                </div>
              </div>
            </aside>
          </div>

          {/* Mobile checkout bar fixed bottom */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3 z-40">
            <div className="max-w-screen-lg mx-auto flex items-center gap-3">
              <div className="flex-1">
                <div className="text-xs text-gray-500">Đã chọn: <span className="font-semibold text-gray-800">{selectedCount}</span></div>
                <div className="text-base font-semibold text-yellow-600">{formatCurrency(selectedGrand)}</div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={selectedCount === 0}
                className={`ml-2 rounded-lg px-4 py-3 text-sm font-semibold text-white ${
                  selectedCount ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Thanh toán ({selectedCount})
              </button>
            </div>
          </div>

          <div className="h-20 lg:hidden" />
        </>
      )}
    </div>
  );
}