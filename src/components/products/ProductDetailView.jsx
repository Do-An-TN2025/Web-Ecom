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

  const handleAddToCart = () => {
    if (!selectedSizeObj) return;
    const finalPrice =
      selectedSizeObj.discountPrice &&
      selectedSizeObj.discountPrice < (selectedSizeObj.price || 0)
        ? selectedSizeObj.discountPrice
        : (selectedSizeObj.price || selectedSizeObj.finalPrice || 0);

    addItem({
      key: `${product._id}-${selectedColor.color}-${selectedSizeCode}`,
      productId: product._id,
      name: product.name,
      color: selectedColor.color,
      colorCode: selectedColor.colorCode,
      size: selectedSizeCode,
      price: finalPrice,
      qty: quantity,
      image: (selectedColor.images && selectedColor.images[0]) || "/placeholder.jpg",
    });

    showAdded({
      name: product.name,
      colorLabel: COLOR_MAP[selectedColor.color] || selectedColor.color,
      size: selectedSizeCode,
      qty: quantity,
      price: finalPrice,
      image: (selectedColor.images && selectedColor.images[0]) || "/placeholder.jpg"
    });
    // Option: reset quantity
    setQuantity(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* GALLERY */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-3 max-h-[600px] overflow-auto pr-1">
            {images.map((img, idx) => (
              <motion.img
                key={idx}
                src={img}
                alt="thumb"
                onClick={() => setImageIndex(idx)}
                className={`w-20 h-24 object-cover rounded-lg cursor-pointer border transition ${
                  imageIndex === idx
                    ? "border-yellow-500 ring-2 ring-yellow-300"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                whileHover={{ scale: 1.04 }}
              />
            ))}
          </div>
          <div className="relative flex-1 rounded-xl overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={imageIndex}
                src={images[imageIndex]}
                alt={product.name}
                className="w-full h-[600px] object-cover"
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
                  className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full shadow"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full shadow"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* INFO */}
        <div>
          {displayPriceBlock()}
          <h1 className="text-2xl font-bold mt-2">{product.name}</h1>
          {selectedSizeObj?.sku && (
            <p className="text-gray-500 text-sm mt-1">{selectedSizeObj.sku}</p>
          )}

            {/* MÀU */}
          <div className="mt-6">
            <p className="font-medium">
              Màu: {COLOR_MAP[selectedColor.color] || selectedColor.color}
            </p>
            <div className="flex gap-3 mt-3">
              {product.variants.map((variant) => (
                <button
                  key={variant._id}
                  onClick={() => handleSelectColor(variant)}
                  className={`w-11 h-11 rounded-full border-2 transition 
                    ${
                      selectedColor._id === variant._id
                        ? "border-yellow-500 ring-2 ring-yellow-300"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  style={{ backgroundColor: variant.colorCode }}
                  title={COLOR_MAP[variant.color] || variant.color}
                />
              ))}
            </div>
          </div>

          {/* SIZE */}
          <div className="mt-6">
            <p className="font-medium">
              Size: {selectedSizeCode || "Chọn size"}
              {selectedSizeObj?.stock >= 0 && (
                <span className="ml-3 text-xs text-gray-500">
                   Tồn kho: {selectedSizeObj.stock}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {allSizeCodes.map((code) => {
                const enabled = allowedForCurrentColor.includes(code);
                const active = selectedSizeCode === code;
                return (
                  <button
                    key={code}
                    disabled={!enabled}
                    onClick={() => enabled && handleSelectSize(code)}
                    className={`px-4 py-2 rounded-lg text-sm border transition
                      ${
                        active
                          ? "border-yellow-500 bg-yellow-50 font-semibold"
                          : "border-gray-300"
                      }
                      ${
                        !enabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:border-yellow-400"
                      }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUANTITY + CART */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border rounded-full overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2 text-lg font-bold"
              >
                -
              </button>
              <span className="px-6 py-2">{quantity}</span>
              <button
                onClick={() =>
                  setQuantity((q) =>
                    selectedSizeObj?.stock
                      ? Math.min(selectedSizeObj.stock, q + 1)
                      : q + 1
                  )
                }
                className="px-4 py-2 text-lg font-bold"
              >
                +
              </button>
            </div>
            <button
              disabled={!selectedSizeObj}
              onClick={handleAddToCart}
              className={`flex-1 rounded-lg px-8 py-3 font-semibold text-white transition
                ${selectedSizeObj
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-gray-300 cursor-not-allowed"}`}
            >
              Thêm vào giỏ
            </button>
          </div>

          {/* Notes */}
          <div className="mt-8 border-t pt-5 space-y-2 text-xs text-gray-600">
            <p>Giao trong 3–5 ngày, freeship đơn từ 498k</p>
            <p>Đổi trả trong vòng 15 ngày</p>
          </div>
        </div>
      </div>
    </div>
  );
}