import { useEffect, useState } from "react";
import { useWishlist } from "../hooks/useWishlist";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, Star, Package } from "lucide-react";
import resolveImage from '../helpers/imageUtils';

function getMainImage(product) {
  if (Array.isArray(product.variants) && product.variants[0]?.images?.[0]) {
    return product.variants[0].images[0];
  }
  return "/no-image.png";
}

function getMinPrice(product) {
  if (!Array.isArray(product.variants)) return "";
  let min = Infinity;
  product.variants.forEach(variant => {
    if (Array.isArray(variant.sizes)) {
      variant.sizes.forEach(size => {
        if (typeof size.price === "number" && size.price < min) min = size.price;
      });
    }
  });
  return min !== Infinity ? min : "";
}

function getColors(product) {
  if (!Array.isArray(product.variants)) return [];
  return product.variants.map(v => ({
    color: v.color,
    colorCode: v.colorCode,
    _id: v._id
  }));
}

export default function WishlistPage() {
  const { wishlist = [], loading, remove, refresh } = useWishlist();
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    await remove(productId);
    setRemovingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải danh sách yêu thích...</p>
        </div>
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Danh sách yêu thích trống
          </h2>
          <p className="text-gray-600 mb-6">
            Bạn chưa thêm sản phẩm nào vào danh sách yêu thích. Hãy khám phá và lưu lại những sản phẩm bạn yêu thích!
          </p>
          <button
            className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            onClick={() => navigate("/")}
          >
            Khám phá sản phẩm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-500 fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sản phẩm yêu thích</h1>
                <p className="text-sm text-gray-500">{wishlist.length} sản phẩm</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/")}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Tiếp tục mua sắm
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((product) => {
            const mainImage = getMainImage(product);
            const minPrice = getMinPrice(product);
            const colors = getColors(product);
            const isRemoving = removingId === product._id;

            return (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                {/* Image Section */}
                <div className="relative overflow-hidden bg-gray-100 aspect-square">
                  <img
                    src={resolveImage(mainImage)}
                    alt={product.name || "Sản phẩm"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = "/no-image.png";
                    }}
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      product.status === "active" 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-400 text-white"
                    }`}>
                      {product.status === "active" ? "Còn hàng" : "Hết hàng"}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(product._id)}
                    disabled={isRemoving}
                    className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full shadow-md hover:bg-red-50 hover:shadow-lg transition-all duration-200 flex items-center justify-center group/btn"
                  >
                    {isRemoving ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Heart className="w-5 h-5 text-red-500 fill-current group-hover/btn:scale-110 transition-transform" />
                    )}
                  </button>

                  {/* Tags */}
                  {Array.isArray(product.tags) && product.tags.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                      {product.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-md text-xs font-semibold uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5">
                  {/* Brand */}
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {product.brand}
                    </span>
                  </div>

                  {/* Product Name */}
                  <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 min-h-[3rem]">
                    {product.name || "Không tên"}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[2.5rem]">
                    {product.shortDescription || "Không có mô tả"}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(product.rating?.average || 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({product.rating?.count || 0})
                    </span>
                  </div>

                  {/* Colors */}
                  {colors.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-gray-500 font-medium">Màu sắc:</span>
                      <div className="flex gap-1.5">
                        {colors.slice(0, 5).map((c) => (
                          <div
                            key={c._id}
                            className="w-6 h-6 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                            style={{ backgroundColor: c.colorCode || "#eee" }}
                            title={c.color}
                          />
                        ))}
                        {colors.length > 5 && (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-600 font-semibold">+{colors.length - 5}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-red-600">
                      {minPrice ? minPrice.toLocaleString("vi-VN") + "đ" : "Liên hệ"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/product/${product.slug || product._id}`)}
                      className="flex-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Xem chi tiết</span>
                    </button>
                    <button
                      onClick={() => handleRemove(product._id)}
                      disabled={isRemoving}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 font-semibold rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}