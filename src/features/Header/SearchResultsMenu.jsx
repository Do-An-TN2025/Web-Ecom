import { useState } from "react";

export default function SearchResultsMenu({
  results,
  onItemClick,
  onClose,
  loading,
  searchQuery,
}) {
  const [selectedColors, setSelectedColors] = useState({});

  const handleColorClick = (productId, colorIndex, e) => {
    e.stopPropagation();
    setSelectedColors((prev) => ({
      ...prev,
      [productId]: colorIndex,
    }));
  };

  return (
    <div className="w-full bg-white shadow-lg border-t border-gray-200 px-8 py-6">
      <div className="container mx-auto">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">
          Kết quả tìm kiếm cho "
          <span className="text-red-600">{searchQuery}</span>"
        </h3>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-600">Đang tìm kiếm...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {results.map((product) => {
              const selectedColorIndex = selectedColors[product._id] || 0;
              const activeVariant = product.colorVariants?.[selectedColorIndex];
              const mainImage =
                activeVariant?.images?.[0] || "/placeholder.jpg";
              const hoverImage = activeVariant?.images?.[1] || mainImage;

              // % giảm giá
              const discountPercent =
                product.onSale && product.price > product.discountPrice
                  ? Math.round(
                      ((product.price - product.discountPrice) /
                        product.price) *
                        100
                    )
                  : 0;

              return (
                <button
                  key={product._id}
                  onClick={() => onItemClick(product.slug)}
                  className="flex flex-col group text-left"
                >
                  <div className="relative aspect-[5/5] overflow-hidden rounded-lg bg-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-lg">
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

                    {discountPercent > 0 && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-1 py-0.5 rounded-full shadow">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col gap-1">
                    <h3 className="text-sm font-semibold text-gray-800 group-hover:text-red-600 line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-red-600">
                        {product.discountPrice?.toLocaleString("vi-VN")}₫
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-xs text-gray-400 line-through">
                          {product.price?.toLocaleString("vi-VN")}₫
                        </span>
                      )}
                    </div>

                    {/* Swatches màu */}
                    <div className="flex gap-1 mt-1">
                      {product.colorVariants?.map((variant, index) => (
                        <button
                          key={index}
                          onClick={(e) =>
                            handleColorClick(product._id, index, e)
                          }
                          className={`h-3 w-3 rounded-full border-2 transition-transform ${
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
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Không tìm thấy sản phẩm nào.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Hãy thử với từ khóa khác
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
