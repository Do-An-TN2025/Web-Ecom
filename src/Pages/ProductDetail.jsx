import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductDetailsBySlug } from "../services/productService";
import ProductDetailView from "../components/products/ProductDetailView";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductDetailsBySlug(slug);
        setProduct(data);
      } catch (error) {
        console.error("Failed to fetch product:", error.message);
      }
    };
    fetchProduct();
  }, [slug]);

  if (!product) {
    return <div className="p-6 text-center">Đang tải sản phẩm...</div>;
  }

  return <ProductDetailView product={product} />;
}
