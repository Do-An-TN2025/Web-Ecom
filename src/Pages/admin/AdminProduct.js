import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/Admin/AdminLayout";
import { getAllProducts, deleteProduct , createProductVariant  } from "../../services/productService";
import { Plus, Edit, Trash2, Eye, Search, Filter, Package, Tag, Palette, Grid3x3 } from "lucide-react";

export default function AdminProductsTable() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getAllProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await deleteProduct(selectedProduct._id, token);
      setProducts(products.filter(p => p._id !== selectedProduct._id));
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  // Calculate total stock from variants
  const getTotalStock = (product) => {
    return product.variants?.reduce((total, variant) => {
      return total + variant.sizes.reduce((sum, size) => sum + size.stock, 0);
    }, 0) || 0;
  };

  // Get price range from variants
  const getPriceRange = (product) => {
    if (!product.variants || product.variants.length === 0) return { min: 0, max: 0 };
    
    let minPrice = Infinity;
    let maxPrice = 0;

    product.variants.forEach(variant => {
      variant.sizes.forEach(size => {
        const price = size.discountPrice && size.discountPrice > 0 ? size.discountPrice : size.price;
        if (price < minPrice) minPrice = price;
        if (price > maxPrice) maxPrice = price;
      });
    });

    return { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice };
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Filter and search
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      inactive: "bg-gray-100 text-gray-700 border border-gray-200",
      draft: "bg-amber-100 text-amber-700 border border-amber-200"
    };
    return styles[status] || styles.active;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Package className="text-white" size={28} />
              </div>
              Product Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your products, variants and inventory</p>
          </div>
          <button 
            onClick={() => window.location.href = '/admin/products/add'}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 hover:shadow-xl"
          >
            <Plus size={20} />
            Add New Product
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, slug, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                <Filter size={20} className="text-gray-600" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'table' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid3x3 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Found <span className="font-semibold text-gray-900">{filteredProducts.length}</span> products
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* Products Display */}
        {viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500">
                <Package size={64} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              paginatedProducts.map((product) => {
                const totalStock = getTotalStock(product);
                const priceRange = getPriceRange(product);
                const colors = [...new Set(product.variants?.map(v => v.color) || [])];

                return (
                  <div 
                    key={product._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      {product.defaultVariant?.images?.[0] ? (
                        <img
                          src={product.defaultVariant.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={48} className="text-gray-300" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${getStatusBadge(product.status)}`}>
                          {product.status || 'active'}
                        </span>
                      </div>

                      {/* Stock Warning */}
                      {totalStock < 10 && totalStock > 0 && (
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 border border-orange-200 backdrop-blur-sm">
                            Low Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{product.brand || 'No Brand'}</p>

                      {/* Price Range */}
                      <div className="mb-4">
                        {priceRange.min === priceRange.max ? (
                          <span className="text-xl font-bold text-gray-900">
                            {formatPrice(priceRange.min)}
                          </span>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
                          </span>
                        )}
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 rounded-lg">
                          <Palette size={14} className="text-blue-600" />
                          <span className="text-xs font-semibold text-blue-700">{colors.length} colors</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-50 rounded-lg">
                          <Tag size={14} className="text-purple-600" />
                          <span className="text-xs font-semibold text-purple-700">{product.variantsCount} variants</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-50 rounded-lg">
                          <Package size={14} className="text-emerald-600" />
                          <span className="text-xs font-semibold text-emerald-700">{totalStock} units</span>
                        </div>
                      </div>

                      {/* Color Swatches */}
                      {colors.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          {colors.slice(0, 5).map((color, idx) => {
                            const variant = product.variants.find(v => v.color === color);
                            return (
                              <div
                                key={idx}
                                className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                                style={{ backgroundColor: variant?.colorCode || '#ddd' }}
                                title={color}
                              />
                            );
                          })}
                          {colors.length > 5 && (
                            <span className="text-xs text-gray-500 font-medium">+{colors.length - 5}</span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.location.href = `/admin/products/${product._id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button
                          onClick={() => window.location.href = `/admin/products/edit/${product._id}`}
                          className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDeleteModal(true);
                          }}
                          className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Table View
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Price Range
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Variants
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <Package size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 font-medium">No products found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => {
                      const totalStock = getTotalStock(product);
                      const priceRange = getPriceRange(product);
                      const colors = [...new Set(product.variants?.map(v => v.color) || [])];

                      return (
                        <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                                {product.defaultVariant?.images?.[0] ? (
                                  <img
                                    src={product.defaultVariant.images[0]}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Package size={24} className="text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                                <div className="text-sm text-gray-500 truncate">{product.slug}</div>
                                {/* Color dots */}
                                {colors.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {colors.slice(0, 4).map((color, idx) => {
                                      const variant = product.variants.find(v => v.color === color);
                                      return (
                                        <div
                                          key={idx}
                                          className="w-4 h-4 rounded-full border border-gray-300"
                                          style={{ backgroundColor: variant?.colorCode || '#ddd' }}
                                          title={color}
                                        />
                                      );
                                    })}
                                    {colors.length > 4 && (
                                      <span className="text-xs text-gray-400">+{colors.length - 4}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">{product.brand || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {priceRange.min === priceRange.max ? (
                                formatPrice(priceRange.min)
                              ) : (
                                <>
                                  {formatPrice(priceRange.min)}
                                  <span className="text-gray-400 mx-1">-</span>
                                  {formatPrice(priceRange.max)}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">
                              <Tag size={12} />
                              {product.variantsCount} variants
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              totalStock < 10 
                                ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              <Package size={12} />
                              {totalStock}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(product.status)}`}>
                              {product.status || 'active'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => window.location.href = `/admin/products/${product._id}`}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => window.location.href = `/admin/products/edit/${product._id}`}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                <span className="font-semibold">
                  {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                </span>{' '}
                of <span className="font-semibold">{filteredProducts.length}</span> products
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Product</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<span className="font-semibold text-gray-900">{selectedProduct?.name}</span>"? 
              This will also delete all variants and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}