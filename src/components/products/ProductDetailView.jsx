import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";


const COLOR_MAP = {
  navy: "Xanh Navy",
  be: "Nâu",
  white: "Trắng",
  black: "Đen",
  grey: "Xám",
  blue: "Xanh dương",
};

const ALL_SIZES = ["S", "M", "L", "XL", "2XL"];


export default function ProductDetailView({ product }) {
  const [selectedColor, setSelectedColor] = useState(product.variants[0]);
  const [selectedSize, setSelectedSize] = useState(product.variants[0].sizes[0]);
  const [selectedImage, setSelectedImage] = useState(product.variants[0].images[0]);
  const [quantity, setQuantity] = useState(1);

  const [index, setIndex] = useState(0); 
  const images = selectedColor.images;
  const nextImage = () => setIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setIndex((prev) => (prev - 1 + images.length) % images.length);
// Khi đổi màu

const handleSelectColor = (variant) => {
  setSelectedColor(variant);

  // Lấy danh sách size từ colorSizeMap
  const sizesForColor = product.colorSizeMap[variant.color] || [];
  console.log("Sizes cho màu", variant.color, ":", sizesForColor);

  // Nếu có size thì chọn size đầu tiên làm mặc định
  if (sizesForColor.length > 0) {
    setSelectedSize(sizesForColor[0]);
  } else {
    setSelectedSize(null);
  }
};


  return (
    
    <div className="container mx-auto px-4 py-8 mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Gallery */}
        <div className="flex gap-4">
          {/* Thumbnail list */}
          <div className="flex flex-col gap-3">
            {images.map((img, idx) => (
              <motion.img
                key={idx}
                src={img}
                alt="thumb"
                onClick={() => setIndex(idx)}
                className={`w-20 h-24 object-cover rounded-lg cursor-pointer border ${
                  index === idx ? "border-yellow-500" : "border-gray-200"
                }`}
                whileHover={{ scale: 1.05 }}
                animate={{ borderColor: index === idx ? "#facc15" : "#e5e7eb" }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>

          {/* Main image */}
             <div className="relative flex-1 overflow-hidden rounded-xl">
            <AnimatePresence mode="wait">
              <motion.img
                key={index}
                src={images[index]}
                alt={product.name}
                className="w-full h-[600px] object-cover"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              />
            </AnimatePresence>

            {/* Prev button */}
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
          </div>
        </div>

        {/* Right: Info */}
        <div>
          {/* Giá */}
          <p className="text-2xl font-semibold text-yellow-600">
            {selectedSize?.price?.toLocaleString()}đ
          </p>
          <h1 className="text-2xl font-bold mt-2">{product.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{selectedSize?.sku}</p>

          {/* Màu sắc */}
          <div className="mt-6">
            <p className="font-medium">Màu sắc: {COLOR_MAP[selectedColor.color] || selectedColor.color}</p>
            <div className="flex gap-3 mt-2">
              {product.variants.map((variant) => (
                <button
                  key={variant._id}
                  onClick={() => handleSelectColor(variant)}
                  className={`w-10 h-10 rounded-full border-2 ${
                    selectedColor._id === variant._id
                      ? "border-yellow-500"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: variant.colorCode }}
                />
              ))}
            </div>
          </div>

         {/* Size */}
{selectedColor && (
  <div className="mt-6">
    <p className="font-medium">
      Kích thước: {selectedSize?.name || "Chọn size"}
    </p>
    <div className="flex gap-2 mt-2">
      {ALL_SIZES.map((size) => {
        // Lấy danh sách size cho màu hiện tại từ colorSizeMap
        const enabled = (product.colorSizeMap[selectedColor.color] || []).includes(size);

        // Lấy object size đầy đủ (price, sku...) nếu có
        const sizeObj = selectedColor.sizes.find((s) => s.name === size);

        return (
          <button
            key={size}
            onClick={() => enabled && setSelectedSize(sizeObj)}
            disabled={!enabled}
            className={`px-4 py-2 border rounded-lg 
              ${selectedSize?.name === size ? "border-yellow-500 bg-yellow-50" : "border-gray-300"}
              ${!enabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {size}
          </button>
        );
      })}
    </div>
  </div>
)}


    
        {/* Quantity + Add to cart */}
        <div className="mt-6 flex items-center gap-4">
        {/* Quantity pill */}
        <div className="flex items-center border rounded-full overflow-hidden">
            <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-4 py-2 text-lg font-bold"
            >
            -
            </button>
            <span className="px-6 py-2">{quantity}</span>
            <button
            onClick={() => setQuantity((q) => q + 1)}
            className="px-4 py-2 text-lg font-bold"
            >
            +
            </button>
        </div>

        <button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-8 py-3 rounded-lg">
            Thêm vào giỏ
        </button>
        </div>


          {/* Store + commitments */}
          <div className="mt-6">
            <a
              href="#"
              className="text-xs text-purple-600 flex items-center gap-2"
            >
              Xem cửa hàng còn sản phẩm
            </a>

            <div className="mt-4 border-t pt-4 space-y-2">
              <p className="flex items-center gap-2 text-xs">
                Giao trong 3–5 ngày và freeship đơn từ 498k
              </p>
              <p className="flex items-center gap-2 text-xs">
                Đổi trả trong vòng 15 ngày
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
