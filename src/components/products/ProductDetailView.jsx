import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useCartToast } from "../../hooks/CartAddNotifier";

const COLOR_MAP = {
  navy: "Xanh Navy",
  be: "Nâu",
  white: "Trắng",
  black: "Đen",
  grey: "Xám",
  blue: "Xanh dương",
  yellow : "Vàng",
  red : "Đỏ",
};

export default function ProductDetailView({ product }) {
  const firstVariant = product.variants[0];
  // sizeCode lưu mã size (S,M,L...) thay vì object
  const [selectedColor, setSelectedColor] = useState(firstVariant);
  const initialSizeCode =
    (firstVariant.sizes[0] && (firstVariant.sizes[0].name || firstVariant.sizes[0].size)) ||
    (product.availableSizes?.[0] || "");
  const [selectedSizeCode, setSelectedSizeCode] = useState(initialSizeCode);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const images = selectedColor.images || [];

  // Tìm size object hiện tại
  const selectedSizeObj = useMemo(
    () =>
      selectedColor.sizes.find(
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
    // Danh sách size hợp lệ cho màu
    const allowedCodes = product.colorSizeMap?.[variant.color] || [];
    // Nếu size hiện tại vẫn tồn tại ở màu mới → giữ nguyên, ngược lại chọn size đầu tiên hợp lệ
    if (!allowedCodes.includes(selectedSizeCode)) {
      const nextCode =
        allowedCodes[0] ||
        (variant.sizes[0] && (variant.sizes[0].name || variant.sizes[0].size)) ||
        "";
      setSelectedSizeCode(nextCode);
    }
  };

  const handleSelectSize = (code) => {
    setSelectedSizeCode(code);
  };

  const prevImage = () =>
    setImageIndex((p) => (p - 1 + images.length) % images.length);
  const nextImage = () =>
    setImageIndex((p) => (p + 1) % images.length);

  const allSizeCodes =
    product.availableSizes && product.availableSizes.length
      ? product.availableSizes
      : Array.from(
          new Set(
            product.variants.flatMap((v) =>
              v.sizes.map((s) => s.name || s.size)
            )
          )
        );

  const allowedForCurrentColor =
    product.colorSizeMap?.[selectedColor.color] || [];

  const { addItem } = useCart();
  const { showAdded } = useCartToast();

const handleAddToCart = async () => {
    if (!selectedSizeObj) return;
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
      image: (selectedColor.images && selectedColor.images[0]) || product.thumbnail || "/placeholder.jpg",
      product: {
        _id: product._id,
        title: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail || null
      },
      variant: {
        _id: selectedColor._id,
        images: selectedColor.images || [],
        sizeInfo: selectedSizeObj
      },
      color: selectedColor.color,
      colorCode: selectedColor.colorCode,
      size: selectedSizeCode
    };

    // debug: log payload
    console.debug('[ProductDetailView] addItem payload:', cartItem);

    try {
      const res = await addItem(cartItem);
      // debug: log response from CartService / CartContext
      console.debug('[ProductDetailView] addItem result:', res);
    } catch (err) {
      console.error('[ProductDetailView] addItem failed', err);
    }

    showAdded({ name: product.name, colorLabel: COLOR_MAP[selectedColor.color] || selectedColor.color, size: selectedSizeCode, qty: quantity, price: finalPrice, image: (selectedColor.images && selectedColor.images[0]) || "/placeholder.jpg" });
    setQuantity(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Gallery Column */}
        <div className="flex flex-col md:flex-row md:gap-5">
          {/* Thumbnails: horizontal scroll on mobile, vertical sticky rail on large screens */}
          <div className="order-2 mt-4 flex w-full gap-2 overflow-x-auto pb-1 md:order-1 md:mt-0 md:h-[640px] md:w-24 md:flex-col md:gap-3 md:overflow-y-auto md:pr-1 lg:sticky lg:top-28">
            {images.map((img, idx) => (
              <motion.button
                type="button"
                key={idx}
                onClick={() => setImageIndex(idx)}
                className={`relative flex-shrink-0 overflow-hidden rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-yellow-400 md:h-24 md:w-20 ${
                  imageIndex === idx
                    ? 'border-yellow-500 ring-2 ring-yellow-300'
                    : 'border-zinc-200 hover:border-zinc-400'
                }`}
                whileHover={{ scale: 1.02 }}
                aria-label={`Ảnh ${idx + 1}`}
                aria-current={imageIndex === idx}
              >
                <img
                  src={img}
                  alt={`${product.name} thumb ${idx + 1}`}
                  className="h-20 w-16 object-cover md:h-full md:w-full"
                  loading={idx > 4 ? 'lazy' : 'eager'}
                />
              </motion.button>
            ))}
          </div>
          {/* Main image */}
            <div className="relative order-1 aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-100 md:order-2 md:flex-1">
              <AnimatePresence mode="wait">
                <motion.img
                  key={imageIndex}
                  src={images[imageIndex]}
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
                      className={`h-1.5 w-6 rounded-full transition ${i === imageIndex ? 'bg-yellow-500' : 'bg-white/60 backdrop-blur'} `}
                    />
                  ))}
                </div>
              )}
            </div>
        </div>

        {/* Info Column */}
        <div className="lg:pt-4">
          <div className="space-y-4 border-b border-zinc-100 pb-6">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-800 md:text-2xl">{product.name}</h1>
            {displayPriceBlock()}
            {selectedSizeObj?.sku && (
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">SKU: {selectedSizeObj.sku}</p>
            )}
          </div>

          {/* Colors */}
          <div className="mt-6">
            <p className="text-sm font-medium text-zinc-700">Màu: <span className="font-semibold text-zinc-900">{COLOR_MAP[selectedColor.color] || selectedColor.color}</span></p>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.variants.map((variant) => {
                const active = selectedColor._id === variant._id;
                return (
                  <button
                    key={variant._id}
                    onClick={() => handleSelectColor(variant)}
                    aria-label={`Chọn màu ${COLOR_MAP[variant.color] || variant.color}`}
                    aria-pressed={active}
                    className={`relative h-11 w-11 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-yellow-400 ${active ? 'border-yellow-500 ring-2 ring-yellow-300' : 'border-zinc-300 hover:border-zinc-400'}`}
                    style={{ backgroundColor: variant.colorCode }}
                    title={COLOR_MAP[variant.color] || variant.color}
                  >
                    {active && <span className="absolute inset-0 rounded-full ring-2 ring-yellow-300" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sizes */}
          <div className="mt-6">
            <p className="text-sm font-medium text-zinc-700">Size: <span className="font-semibold text-zinc-900">{selectedSizeCode || 'Chọn size'}</span>
              {selectedSizeObj?.stock >= 0 && (
                <span className="ml-3 text-[11px] font-medium text-zinc-500">Tồn: {selectedSizeObj.stock}</span>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {allSizeCodes.map(code => {
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
                      active ? 'bg-zinc-900 text-white shadow-sm' : 'bg-zinc-100 text-zinc-700'
                    } ${enabled ? 'hover:bg-zinc-200' : 'cursor-not-allowed opacity-40'} `}
                  >{code}</button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Add */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="inline-flex items-center overflow-hidden rounded-full border border-zinc-200 bg-white shadow-sm">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="px-4 py-2 text-lg font-bold text-zinc-600 hover:text-zinc-900"
                aria-label="Giảm số lượng"
              >–</button>
              <span className="min-w-[48px] px-4 py-2 text-center text-sm font-medium text-zinc-800">{quantity}</span>
              <button
                onClick={() => setQuantity(q => selectedSizeObj?.stock ? Math.min(selectedSizeObj.stock, q + 1) : q + 1)}
                className="px-4 py-2 text-lg font-bold text-zinc-600 hover:text-zinc-900"
                aria-label="Tăng số lượng"
              >+</button>
            </div>
            <button
              disabled={!selectedSizeObj}
              onClick={handleAddToCart}
              className={`flex-1 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${selectedSizeObj ? 'bg-yellow-500 hover:bg-yellow-600' : 'cursor-not-allowed bg-zinc-300'} `}
            >Thêm vào giỏ</button>
          </div>

          {/* Notes */}
          <div className="mt-8 space-y-2 rounded-lg bg-zinc-50 p-4 text-[11px] text-zinc-600 ring-1 ring-inset ring-zinc-100">
            <p>Giao trong 3–5 ngày, freeship đơn từ 498k</p>
            <p>Đổi trả trong vòng 15 ngày</p>
          </div>
        </div>
      </div>
    </div>
  );
}