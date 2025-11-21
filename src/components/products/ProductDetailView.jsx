import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Package, RotateCcw, Truck } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useCartToast } from "../../hooks/CartAddNotifier";
import { getRecentlyViewedProducts } from "../../services/productService";
import resolveImage from '../../helpers/imageUtils';

const COLOR_MAP = {
  navy: "Xanh Navy",
  be: "Nâu",
  white: "Trắng",
  black: "Đen",
  grey: "Xám",
  blue: "Xanh dương",
  yellow: "Vàng",
  red: "Đỏ",
};

export default function ProductDetailView({ product }) {
  const firstVariant = product?.variants?.[0] || {
    _id: "",
    color: "",
    colorCode: "#eee",
    images: [],
    sizes: [],
  };

  const [selectedColor, setSelectedColor] = useState(firstVariant);
  const initialSizeCode =
    (firstVariant.sizes?.[0] &&
      (firstVariant.sizes[0].name || firstVariant.sizes[0].size)) ||
    product?.availableSizes?.[0] ||
    "";
  const [selectedSizeCode, setSelectedSizeCode] = useState(initialSizeCode);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const isAddingRef = useRef(false);
  const [activeTab, setActiveTab] = useState("description"); // description | shipping | returns
  const images = selectedColor.images || [];

  // persist recent slugs (array, newest first, max 20)
  useEffect(() => {
    try {
      const slug = product?.slug;
      if (!slug || typeof window === "undefined") return;
      const KEY = "recentlyViewedSlugs";
      const raw = localStorage.getItem(KEY);
      let arr = [];
      try {
        arr = Array.isArray(JSON.parse(raw || "[]"))
          ? JSON.parse(raw || "[]")
          : [];
      } catch {
        arr = (raw || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (!Array.isArray(arr)) arr = [];
      const idx = arr.indexOf(slug);
      if (idx !== -1) arr.splice(idx, 1);
      arr.unshift(slug);
      const MAX = 20;
      if (arr.length > MAX) arr = arr.slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (err) {
      console.debug("[ProductDetailView] persist recent slugs failed", err);
    }
  }, [product?.slug]);

  // recently viewed products
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (typeof window === "undefined") return;
        const KEY = "recentlyViewedSlugs";
        const raw = localStorage.getItem(KEY);
        let slugs = [];
        try {
          slugs = Array.isArray(JSON.parse(raw || "[]"))
            ? JSON.parse(raw || "[]")
            : [];
        } catch {
          slugs = (raw || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        slugs = (slugs || []).filter((s) => s && s !== product?.slug);
        if (!slugs.length) {
          if (mounted) setRecentProducts([]);
          return;
        }

        const MAX_FETCH = 12;
        const reqSlugs = slugs.slice(0, MAX_FETCH);

        setRecentLoading(true);
        const res = await getRecentlyViewedProducts(reqSlugs);
        const items = res?.products || [];

        const mapBySlug = {};
        items.forEach((it) => {
          if (it?.slug) mapBySlug[it.slug] = it;
        });
        const ordered = reqSlugs.map((s) => mapBySlug[s]).filter(Boolean);
        if (mounted) setRecentProducts(ordered);
      } catch (err) {
        console.debug("[ProductDetailView] fetch recent failed", err);
        if (mounted) setRecentProducts([]);
      } finally {
        if (mounted) setRecentLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [product?.slug]);

  // size object
  const selectedSizeObj = useMemo(
    () =>
      (selectedColor.sizes || []).find(
        (s) => (s.name || s.size) === selectedSizeCode
      ) || null,
    [selectedColor, selectedSizeCode]
  );

  const displayPriceBlock = () => {
    if (!selectedSizeObj) return null;
    const base = selectedSizeObj.price || selectedSizeObj.finalPrice || 0;
    const discount =
      selectedSizeObj.discountPrice && selectedSizeObj.discountPrice < base
        ? selectedSizeObj.discountPrice
        : null;
    return (
      <div className="flex items-end gap-3">
        <p className="text-2xl font-semibold text-yellow-600">
          {(discount || base).toLocaleString()}đ
        </p>
        {discount && (
          <p className="text-sm line-through text-gray-400">
            {base.toLocaleString()}đ
          </p>
        )}
      </div>
    );
  };

  const handleSelectColor = (variant) => {
    setSelectedColor(variant);
    setImageIndex(0);
    const allowedCodes = product.colorSizeMap?.[variant.color] || [];
    if (!allowedCodes.includes(selectedSizeCode)) {
      const nextCode =
        allowedCodes[0] ||
        (variant.sizes?.[0] &&
          (variant.sizes[0].name || variant.sizes[0].size)) ||
        "";
      setSelectedSizeCode(nextCode);
    }
  };

  const handleSelectSize = (code) => {
    setSelectedSizeCode(code);
  };

  const prevImage = () =>
    setImageIndex((p) => (p - 1 + images.length) % (images.length || 1));
  const nextImage = () => setImageIndex((p) => (p + 1) % (images.length || 1));

  const allSizeCodes =
    product?.availableSizes && product.availableSizes.length
      ? product.availableSizes
      : Array.from(
          new Set(
            (product?.variants || []).flatMap((v) =>
              (v.sizes || []).map((s) => s.name || s.size)
            )
          )
        );

  const allowedForCurrentColor =
    product?.colorSizeMap?.[selectedColor.color] || [];

  const { addItem, items, updateQty } = useCart();  
  const { showAdded } = useCartToast();

  const handleAddToCart = async () => {
    if (!selectedSizeObj) return;
    if (isAddingRef.current) return;
    // Client-side stock check for guests (no API call) — show a single Vietnamese toast and abort
    try {
      const availableStock = Number(
        selectedSizeObj.stock ?? selectedSizeObj.available ?? selectedSizeObj.count ?? Infinity
      );

      // If requested qty alone exceeds stock, abort immediately
      if (Number.isFinite(availableStock) && Number(quantity) > availableStock) {
        try {
          toast.warn("Số lượng yêu cầu vượt quá tồn kho", { toastId: "exceeds-stock" });
        } catch (e) {
          console.error('[ProductDetailView] toast.warn failed', e);
        }
        return;
      }

      // Additionally, if user is a guest the cart may be stored in localStorage under 'app_cart_v1'.
      // Check existing quantity in that local cart and warn if existing + requested > stock.
      try {
        const LS_KEY = "app_cart_v1";
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) {
            let parsed = [];
            try {
              parsed = JSON.parse(raw);
            } catch (e) {
              parsed = [];
            }
            const itemsArr = Array.isArray(parsed)
              ? parsed
              : Array.isArray(parsed?.items)
              ? parsed.items
              : [];

            const pendingKey = `${product._id}-${selectedColor._id}-${selectedSizeCode}`;
            const existing = (itemsArr || []).find(
              (it) =>
                it?.key === pendingKey ||
                (it?.productId === product._id && it?.variantId === selectedColor._id && it?.size === selectedSizeCode)
            );
            const existingQty = Number(existing?.qty ?? existing?.quantity ?? 0);
            if (Number.isFinite(availableStock) && existingQty + Number(quantity) > availableStock) {
              try {
                toast.warn("Số lượng yêu cầu vượt quá tồn kho", { toastId: "exceeds-stock" });
              } catch (e) {
                console.error('[ProductDetailView] toast.warn failed', e);
              }
              return;
            }
          }
        }
      } catch (e) {
        console.error('[ProductDetailView] localStorage stock check failed', e);
      }
    } catch (e) {
      console.error('[ProductDetailView] stock check failed', e);
    }
    // set immediate lock to prevent rapid double-clicks
    isAddingRef.current = true;
    setIsAdding(true);

    const basePrice = selectedSizeObj.price || selectedSizeObj.finalPrice || 0;
    const discountPrice =
      selectedSizeObj.discountPrice && selectedSizeObj.discountPrice < basePrice
        ? selectedSizeObj.discountPrice
        : 0;
    const finalPrice = discountPrice || basePrice;

    const cartItem = {
      key: `${product._id}-${selectedColor._id}-${selectedSizeCode}`,
      productId: product._id,
      variantId: selectedColor._id,
      qty: quantity,
      quantity: quantity,
      price: basePrice,
      discountPrice: discountPrice,
      finalPrice: finalPrice,
      name: product.name,
      image:
        (selectedColor.images && selectedColor.images[0]) ||
        product.thumbnail ||
        "/placeholder.jpg",
      product: {
        _id: product._id,
        title: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail || null,
      },
      variant: {
        _id: selectedColor._id,
        images: selectedColor.images || [],
        sizeInfo: selectedSizeObj,
      },
      color: selectedColor.color,
      colorCode: selectedColor.colorCode,
      size: selectedSizeCode,
    };

    try {
      console.debug("[AddCart] items(from context) before add:", items);
      console.debug("[AddCart] cartItem.key", cartItem.key, "qty:", quantity);

      // try find existing in context items
      let existing = (items || []).find(
        (it) =>
          it.key === cartItem.key ||
          (it.productId === cartItem.productId &&
            it.variantId === cartItem.variantId &&
            (it.size === cartItem.size))
      );

      // fallback: try read cart snapshot from localStorage (adjust key if your CartContext uses different key)
      if (!existing && typeof window !== "undefined") {
        try {
          const ls = localStorage.getItem("cart") || localStorage.getItem("cartItems") || localStorage.getItem("myCart");
          if (ls) {
            const parsed = JSON.parse(ls);
            const flat = Array.isArray(parsed) ? parsed : (parsed?.items || []);
            existing = (flat || []).find(
              (it) =>
                it.key === cartItem.key ||
                (it.productId === cartItem.productId &&
                  it.variantId === cartItem.variantId &&
                  (it.size === cartItem.size))
            );
            console.debug("[AddCart] found existing in localStorage fallback:", existing);
          }
        } catch (e) {
          console.debug("[AddCart] localStorage parse failed", e);
        }
      }

      if (existing) {
        const currentQty = Number(existing.qty ?? existing.quantity ?? 0);
        const newQty = currentQty + Number(quantity);
        console.debug("[AddCart] updating qty ->", newQty);
        await updateQty(existing.key || existing.id || existing._id || existing.key, newQty);
      } else {
        console.debug("[AddCart] adding new item");
        await addItem(cartItem);
      }

      console.debug("[AddCart] items(after) snapshot:", items);
      showAdded({
        name: product.name,
        colorLabel: COLOR_MAP[selectedColor.color] || selectedColor.color,
        size: selectedSizeCode,
        qty: quantity,
        price: finalPrice,
        image:
          (selectedColor.images && selectedColor.images[0]) || "/placeholder.jpg",
      });
      setQuantity(1);
    } catch (err) {
      console.error("[ProductDetailView] add/update cart failed", err);
    } finally {
      isAddingRef.current = false;
      setIsAdding(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Gallery Column */}
        <div className="flex flex-col md:flex-row md:gap-5">
          <div className="order-2 mt-4 flex w-full gap-2 overflow-x-auto pb-1 md:order-1 md:mt-0 md:h-[640px] md:w-24 md:flex-col md:gap-3 md:overflow-y-auto md:pr-1 lg:sticky lg:top-28">
            {images.map((img, idx) => (
              <motion.button
                type="button"
                key={idx}
                onClick={() => setImageIndex(idx)}
                className={`relative flex-shrink-0 overflow-hidden rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-yellow-400 md:h-24 md:w-20 ${
                  imageIndex === idx
                    ? "border-yellow-500 ring-2 ring-yellow-300"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
                whileHover={{ scale: 1.02 }}
                aria-label={`Ảnh ${idx + 1}`}
                aria-current={imageIndex === idx}
              >
                <img
                  src={resolveImage(img)}
                  alt={`${product.name} thumb ${idx + 1}`}
                  className="h-20 w-16 object-cover md:h-full md:w-full"
                  loading={idx > 4 ? "lazy" : "eager"}
                />
              </motion.button>
            ))}
          </div>

          <div className="relative order-1 aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-100 md:order-2 md:flex-1">
            <AnimatePresence mode="wait">
              <motion.img
                key={imageIndex}
                src={resolveImage(images[imageIndex] || product.thumbnail)}
                alt={product.name}
                className="h-full w-full object-cover"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              />
            </AnimatePresence>

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-2 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-2 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  aria-label="Ảnh tiếp theo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {images.length > 1 && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition ${
                      i === imageIndex
                        ? "bg-yellow-500"
                        : "bg-white/60 backdrop-blur"
                    } `}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Column */}
        <div className="lg:pt-4">
          <div className="space-y-4 border-b border-zinc-100 pb-6">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-800 md:text-2xl">
              {product.name}
            </h1>
            {displayPriceBlock()}
            {selectedSizeObj?.sku && (
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                SKU: {selectedSizeObj.sku}
              </p>
            )}
          </div>

          {/* Colors */}
          <div className="mt-6">
            <p className="text-sm font-medium text-zinc-700">
              Màu:{" "}
              <span className="font-semibold font-bold text-upper  text-zinc-900">
                {COLOR_MAP[selectedColor.color] || selectedColor.color}
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.variants.map((variant) => {
                const active = selectedColor._id === variant._id;
                return (
                  <button
                    key={variant._id}
                    onClick={() => handleSelectColor(variant)}
                    aria-label={`Chọn màu ${
                      COLOR_MAP[variant.color] || variant.color
                    }`}
                    aria-pressed={active}
                    className={`relative h-11 w-11 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                      active
                        ? "border-yellow-500 ring-2 ring-yellow-300"
                        : "border-zinc-300 hover:border-zinc-400"
                    }`}
                    style={{ backgroundColor: variant.colorCode }}
                    title={COLOR_MAP[variant.color] || variant.color}
                  >
                    {active && (
                      <span className="absolute inset-0 rounded-full ring-2 ring-yellow-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sizes */}
          <div className="mt-6">
            <p className="text-sm font-medium text-zinc-700">
              Size:{" "}
              <span className="font-semibold text-zinc-900">
                {selectedSizeCode || "Chọn size"}
              </span>
              {selectedSizeObj?.stock >= 0 && (
                <span className="ml-3 text-[11px] font-medium text-zinc-500">
                  Tồn: {selectedSizeObj.stock}
                  {selectedSizeObj.stock < 5 && selectedSizeObj.stock > 0 && (
                    <span className="ml-2 text-orange-600">⚠️ Sắp hết</span>
                  )}
                  {selectedSizeObj.stock === 0 && (
                    <span className="ml-2 text-red-600">❌ Hết hàng</span>
                  )}
                </span>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {allSizeCodes.map((code) => {
                const enabled = allowedForCurrentColor.includes(code);
                const active = selectedSizeCode === code;
                return (
                  <button
                    key={code}
                    disabled={!enabled}
                    aria-disabled={!enabled}
                    aria-pressed={active}
                    onClick={() => enabled && handleSelectSize(code)}
                    className={`min-w-[48px] rounded-md px-3 py-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                      active
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "bg-zinc-100 text-zinc-700"
                    } ${
                      enabled
                        ? "hover:bg-zinc-200"
                        : "cursor-not-allowed opacity-40"
                    } `}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Add */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="inline-flex items-center overflow-hidden rounded-full border border-zinc-200 bg-white shadow-sm">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2 text-lg font-bold text-zinc-600 hover:text-zinc-900"
                aria-label="Giảm số lượng"
              >
                –
              </button>
              <span className="min-w-[48px] px-4 py-2 text-center text-sm font-medium text-zinc-800">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) =>
                    selectedSizeObj?.stock
                      ? Math.min(selectedSizeObj.stock, q + 1)
                      : q + 1
                  )
                }
                className="px-4 py-2 text-lg font-bold text-zinc-600 hover:text-zinc-900"
                aria-label="Tăng số lượng"
              >
                +
              </button>
            </div>
            <button
              disabled={!selectedSizeObj || isAdding}
              onClick={handleAddToCart}
              className={`flex-1 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                selectedSizeObj
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "cursor-not-allowed bg-zinc-300"
              } `}
            >
              Thêm vào giỏ
            </button>
          </div>

          {/* Notes */}
          <div className="mt-8 space-y-2 rounded-lg bg-zinc-50 p-4 text-[11px] text-zinc-600 ring-1 ring-inset ring-zinc-100">
            <p>Giao trong 3–5 ngày, freeship đơn từ 498k</p>
            <p>Đổi trả trong vòng 15 ngày</p>
          </div>

          {/* Rating Section */}
          {product.rating && (
            <div className="mt-6 flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(product.rating.average || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-zinc-200 text-zinc-200"
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-zinc-900">
                  {product.rating.average > 0
                    ? product.rating.average.toFixed(1)
                    : "Chưa có đánh giá"}
                </span>
                {product.rating.count > 0 && (
                  <span className="ml-2 text-zinc-500">
                    ({product.rating.count} đánh giá)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-12 border-t pt-8">
        <div className="flex gap-6 border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "description"
                ? "border-b-2 border-yellow-500 text-yellow-600"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Package className="inline-block mr-2 h-4 w-4" />
            Mô tả sản phẩm
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "shipping"
                ? "border-b-2 border-yellow-500 text-yellow-600"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Truck className="inline-block mr-2 h-4 w-4" />
            Vận chuyển
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "returns"
                ? "border-b-2 border-yellow-500 text-yellow-600"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <RotateCcw className="inline-block mr-2 h-4 w-4" />
            Đổi trả
          </button>
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeTab === "description" && (
              <motion.div
                key="description"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="prose prose-sm max-w-none"
              >
                {product.shortDescription ? (
                  <div className="space-y-4 text-zinc-700">
                    {product.shortDescription.split("\n\n").map((section, idx) => {
                      const lines = section.split("\n");
                      const title = lines[0];
                      const content = lines.slice(1);

                      return (
                        <div key={idx} className="rounded-lg bg-zinc-50 p-4">
                          <h3 className="mb-2 text-base font-semibold text-zinc-900">
                            {title}
                          </h3>
                          <ul className="ml-4 space-y-1 text-sm">
                            {content.map((line, i) => {
                              const cleanLine = line.replace(/^[•\-]\s*/, "").trim();
                              if (!cleanLine) return null;
                              return (
                                <li key={i} className="list-disc">
                                  {cleanLine}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-zinc-500">Chưa có mô tả chi tiết.</p>
                )}
              </motion.div>
            )}

            {activeTab === "shipping" && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-sm text-zinc-700"
              >
                <div className="rounded-lg bg-zinc-50 p-4">
                  <h4 className="font-semibold text-zinc-900">🚚 Giao hàng tiêu chuẩn</h4>
                  <p className="mt-2">Thời gian: 3-5 ngày làm việc</p>
                  <p>Phí ship: 30.000đ (Miễn phí cho đơn từ 498.000đ)</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-4">
                  <h4 className="font-semibold text-zinc-900">⚡ Giao hàng nhanh</h4>
                  <p className="mt-2">Thời gian: 1-2 ngày làm việc</p>
                  <p>Phí ship: 50.000đ (Áp dụng khu vực nội thành)</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-4">
                  <h4 className="font-semibold text-zinc-900">📦 Kiểm tra hàng khi nhận</h4>
                  <p className="mt-2">
                    Bạn có thể kiểm tra sản phẩm trước khi thanh toán cho nhân viên giao hàng.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "returns" && (
              <motion.div
                key="returns"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-sm text-zinc-700"
              >
                <div className="rounded-lg bg-zinc-50 p-4">
                  <h4 className="font-semibold text-zinc-900">🔄 Chính sách đổi trả</h4>
                  <ul className="mt-2 ml-4 space-y-1 list-disc">
                    <li>Đổi trả trong vòng 15 ngày kể từ ngày nhận hàng</li>
                    <li>Sản phẩm chưa qua sử dụng, còn nguyên tem mác</li>
                    <li>Miễn phí đổi size/màu (1 lần đổi)</li>
                    <li>Hoàn tiền 100% nếu lỗi từ nhà sản xuất</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-zinc-50 p-4">
                  <h4 className="font-semibold text-zinc-900">❌ Không áp dụng đổi trả</h4>
                  <ul className="mt-2 ml-4 space-y-1 list-disc">
                    <li>Sản phẩm đã qua sử dụng hoặc giặt tẩy</li>
                    <li>Sản phẩm bị rách, bẩn do người dùng</li>
                    <li>Mất tem mác, hóa đơn mua hàng</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {recentProducts && recentProducts.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-zinc-900">
              Sản phẩm đã xem gần đây
            </h2>
            {recentLoading && (
              <p className="text-sm text-zinc-500">Đang tải...</p>
            )}
          </div>

          <RecentlyViewedList items={recentProducts} loading={recentLoading} />
        </div>
      )}
    </div>
  );
}

// small internal component for horizontal scroller
function RecentlyViewedList({ items = [], loading = false }) {
  const listRef = useRef(null);

  const scrollBy = (distance) => {
    if (!listRef.current) return;
    listRef.current.scrollBy({ left: distance, behavior: "smooth" });
  };

  return (
    <div className="mt-6 relative">
      <div
        ref={listRef}
        className="flex gap-6 overflow-x-auto pb-3 pl-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-300"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[220px] shrink-0 animate-pulse">
              <div className="h-52 w-full rounded bg-zinc-200" />
              <div className="mt-3 h-3 w-3/4 rounded bg-zinc-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-zinc-200" />
            </div>
          ))
        ) : items && items.length ? (
          items.map((p) => (
            <a
              key={p._id}
              href={`/product/${p.slug}`}
              className="min-w-[220px] max-w-[220px] shrink-0 rounded-lg bg-white p-3 shadow-sm transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[3/4] mb-3 overflow-hidden rounded bg-zinc-100">
                <img
                  src={
                    (p.images && p.images[0]) ||
                    p.thumbnail ||
                    "/placeholder.jpg"
                  }
                  alt={p.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="text-sm text-zinc-700 line-clamp-2">{p.name}</div>
              <div className="mt-2 text-sm font-semibold text-zinc-900">
                {(p.finalPrice || 0).toLocaleString()}đ
              </div>
            </a>
          ))
        ) : (
          <div className="min-w-full py-6">
            <div className="text-sm text-zinc-500">
              Chưa có sản phẩm đã xem gần đây.
            </div>
          </div>
        )}
      </div>

      {/* navigation buttons for larger screens */}
      {items && items.length > 3 && (
        <>
          <button
            onClick={() => scrollBy(-260)}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-2 shadow ring-1 ring-zinc-200 hover:bg-white focus:outline-none"
            aria-label="Trượt sang trái"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <ChevronLeft className="h-5 w-5 text-zinc-700" />
          </button>
          <button
            onClick={() => scrollBy(260)}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-2 shadow ring-1 ring-zinc-200 hover:bg-white focus:outline-none"
            aria-label="Trượt sang phải"
            style={{ transform: "translate(50%, -50%)" }}
          >
            <ChevronRight className="h-5 w-5 text-zinc-700" />
          </button>
        </>
      )}
    </div>
  );
}
