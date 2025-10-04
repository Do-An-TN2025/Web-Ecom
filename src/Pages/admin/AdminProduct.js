import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";
import ProductHeader from "../../components/Admin/Product/ProductHeader";
import ProductTable from "../../components/Admin/Product/ProductTable";
import { getAllProducts, deleteProduct } from "../../services/productService";

const AdminProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data.products || data);
    } catch (error) {
      console.error("Error fetching products:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (filters) => {
    console.log("Search with filters:", filters);
  };

  const handleAddProduct = () => {
    console.log("Open form thêm sản phẩm");
  };

  const handleView = (row) => {
    console.log("Xem chi tiết:", row);
  };

  const handleEdit = (row) => {
    console.log("Chỉnh sửa:", row);
  };

  const handleDelete = async (row) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá sản phẩm này?")) {
      try {
        const token = localStorage.getItem("token");
        await deleteProduct(row._id, token);
        fetchProducts();
      } catch (error) {
        console.error("Delete failed:", error.message);
      }
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: 16 }}>
       <ProductHeader onAddSuccess={fetchProducts} />
        <ProductTable
          products={products?.data || []}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminProduct;
