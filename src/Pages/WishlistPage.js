import useWishlist from "../hooks/useWishlist";
import { useNavigate } from "react-router-dom";

export default function WishlistPage() {
  const { wishlist, loading, refresh } = useWishlist();
  const navigate = useNavigate();

  if (loading) return <div className="p-8 text-center">Đang tải danh sách yêu thích...</div>;

  if (!wishlist.length)
    return (
      <div className="p-8 text-center">
        <p>Bạn chưa có sản phẩm yêu thích nào.</p>
        <button
          className="mt-4 px-4 py-2 bg-yellow-400 text-white rounded"
          onClick={() => navigate("/")}
        >
          Về trang chủ
        </button>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Danh sách yêu thích</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((product) => (
          <div key={product._id} className="border rounded-lg p-3 flex flex-col items-center">
            <img
              src={product.images?.[0]}
              alt={product.name}
              className="w-full h-40 object-cover rounded mb-2"
            />
            <div className="font-semibold text-center">{product.name}</div>
            <div className="text-red-600 font-bold mt-1">{product.price?.toLocaleString()}đ</div>
            <button
              className="mt-2 px-3 py-1 bg-rose-500 text-white rounded text-xs"
              onClick={refresh}
            >
              Làm mới
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}