import { useState } from "react";
import { Link } from "react-router-dom";

const ProductGrid = ({ products = [] }) => {
  const [selectedColors, setSelectedColors] = useState({});

  const handleColorClick = (productId, colorIndex) => {
    setSelectedColors((prev) => ({
      ...prev,
      [productId]: colorIndex,
    }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => {
        const selectedColorIndex = selectedColors[product._id] || 0;
        const activeVariant = product.colorVariants?.[selectedColorIndex];
        const mainImage = activeVariant?.images?.[0] || "/placeholder.jpg";
        const hoverImage = activeVariant?.images?.[1] || mainImage;

        // Tính % giảm giá
        const discountPercent =
          product.onSale && product.price > product.discountPrice
            ? Math.round(
                ((product.price - product.discountPrice) / product.price) * 100
              )
            : 0;

        return (
          <Link
            to={`/product/${product.slug || product._id}`}
            key={product._id}
            className="group flex flex-col"
          >
            {/* Image */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-lg">
              <img
                src={mainImage}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {hoverImage !== mainImage && (
                <img
                  src={hoverImage}
                  alt={`${product.name} hover`}
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}

              {/* Badge Sale */}
              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full shadow">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* Info */}
            <div className="mt-3 flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-gray-800 group-hover:text-yellow-600 line-clamp-1">
                {product.name}
              </h3>

              {/* Giá */}
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-red-600">
                  {product.discountPrice?.toLocaleString()}đ
                </span>
                {discountPercent > 0 && (
                  <span className="text-xs text-gray-500 line-through">
                    {product.price?.toLocaleString()}đ
                  </span>
                )}
              </div>

              {/* Swatches màu */}
              <div className="flex gap-2 mt-1">
                {product.colorVariants?.map((variant, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleColorClick(product._id, index);
                    }}
                    className={`h-5 w-5 rounded-full border-2 transition-transform ${
                      selectedColorIndex === index
                        ? "border-yellow-500 scale-110"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: variant.colorCode }}
                    title={variant.color}
                  />
                ))}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default ProductGrid;
