import { useState } from "react";
import { Link } from "react-router-dom";
import { addToWishlistService, removeFromWishlistService , applyTokenFromStorage} from "../../services/AuthService";

const ProductGrid = ({ products = [] }) => {
  const [selectedColors, setSelectedColors] = useState({});
  const [wishlisted, setWishlisted] = useState({});
  const [loading, setLoading] = useState({});

  const handleColorClick = (productId, colorIndex) => {
    setSelectedColors((prev) => ({
      ...prev,
      [productId]: colorIndex,
    }));
  };
  applyTokenFromStorage();
  const handleWishlist = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading((prev) => ({ ...prev, [product._id]: true }));
    try {
      if (wishlisted[product._id]) {
        await removeFromWishlistService({ productId: product._id });
        setWishlisted((prev) => ({ ...prev, [product._id]: false }));
      } else {
        await addToWishlistService({ productId: product._id });
        setWishlisted((prev) => ({ ...prev, [product._id]: true }));
      }
    } catch (err) {
      // Xử lý lỗi nếu cần
    } finally {
      setLoading((prev) => ({ ...prev, [product._id]: false }));
    }
  };

  const getDisplayPricing = (product, activeVariant) => {
    const sizes = activeVariant?.sizes || [];
    if (!sizes.length) {
      const hasDiscount =
        product.onSale &&
        product.discountPrice > 0 &&
        product.discountPrice < product.price;

      return {
        hasDiscount,
        display: hasDiscount ? product.discountPrice : product.price,
        original: hasDiscount ? product.price : null,
        percent: hasDiscount
          ? Math.round(
              ((product.price - product.discountPrice) / product.price) * 100
            )
          : 0,
      };
    }

    const basePrices = sizes.map(
      (s) => s.price ?? s.finalPrice ?? 0
    );
    const discountPrices = sizes
      .filter(
        (s) =>
          s.discountPrice &&
          s.discountPrice > 0 &&
          s.discountPrice < (s.price ?? s.finalPrice ?? 0)
      )
      .map((s) => s.discountPrice);

    const minBase = Math.min(...basePrices);
    const minDiscount = discountPrices.length
      ? Math.min(...discountPrices)
      : null;

    const hasDiscount = !!minDiscount && minDiscount < minBase;
    const percent = hasDiscount
      ? Math.round(((minBase - minDiscount) / minBase) * 100)
      : 0;

    return {
      hasDiscount,
      display: hasDiscount ? minDiscount : minBase,
      original: hasDiscount ? minBase : null,
      percent,
    };
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => {
        const selectedColorIndex = selectedColors[product._id] || 0;
        const activeVariant = product.colorVariants?.[selectedColorIndex];
        const mainImage = activeVariant?.images?.[0] || "/placeholder.jpg";
        const hoverImage = activeVariant?.images?.[1] || mainImage;

        const pricing = getDisplayPricing(product, activeVariant);

        return (
          <Link
            to={`/product/${product.slug || product._id}`}
            key={product._id}
            className="group flex flex-col"
          >
            {/* Image */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-lg">
              {/* Wishlist button */}
              <button
                className="absolute top-3 right-3 z-10 text-red-500 hover:scale-110 transition"
                onClick={(e) => handleWishlist(e, product)}
                aria-label={wishlisted[product._id] ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
                disabled={loading[product._id]}
              >
                {wishlisted[product._id] ? (
                  // Solid heart
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                ) : (
                  // Outline heart
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z" />
                  </svg>
                )}
              </button>
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

              {pricing.percent > 0 && (
                <span className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full shadow">
                  -{pricing.percent}%
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
                  {pricing.display?.toLocaleString()}đ
                </span>
                {pricing.original && (
                  <span className="text-xs text-gray-500 line-through">
                    {pricing.original.toLocaleString()}đ
                  </span>
                )}
              </div>

              {/* Swatches */}
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
                    style={{ backgroundColor: variant.colorCode?.trim() }}
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
