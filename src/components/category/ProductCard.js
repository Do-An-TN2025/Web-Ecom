import { useState } from "react";
import { addToWishlistService, removeFromWishlistService } from "../../services/AuthService";

const ProductCard = ({ product }) => {
  const [wishlisted, setWishlisted] = useState(product.isWishlisted || false);
  const [loading, setLoading] = useState(false);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (wishlisted) {
        await removeFromWishlistService({ productId: product._id });
        setWishlisted(false);
      } else {
        await addToWishlistService({ productId: product._id });
        setWishlisted(true);
      }
    } catch (err) {
      // Xử lý lỗi nếu cần
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow relative">
      {/* Wishlist button */}
      <button
        className="absolute top-3 right-3 z-10 text-red-500 hover:scale-110 transition"
        onClick={handleWishlist}
        aria-label={wishlisted ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
        disabled={loading}
      >
        {wishlisted ? (
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
        src={product?.images[0]} 
        alt={product.name}
        className="w-full h-64 object-cover rounded-md"
      />
      <h3 className="mt-4 font-semibold text-lg">{product.name}</h3>
      <div className="mt-2">
        {product.onSale ? (
          <>
            <span className="text-red-600 font-bold">
              ${product.discountPrice}
            </span>
            <span className="ml-2 text-gray-400 line-through">
              ${product.price}
            </span>
          </>
        ) : (
          <span className="font-bold">${product.price}</span>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        {product.availableColors.map(color => (
          <div 
            key={color}
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductCard;