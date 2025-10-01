import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getCategoryBySlug } from "../services/categoryService";
import { getProductsBySlug } from "../services/productService";
import CategoryHeader from "../components/category/CategoryHeader";
import ProductGrid from "../components/category/ProductGrid";
import Pagination from "../components/category/Pagination";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import Breadcrumb from "../components/category/Breadcrumb";
import FilterTabs from "../components/category/FilterTabs";

const initialFilters = {
  page: 1,
  limit: 8,
  sortBy: "createdAt",
  sortOrder: "desc",
};

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [priceDirection, setPriceDirection] = useState("asc");

  const [state, setState] = useState({
    products: [],
    category: null,
    pagination: null,
    loading: true,
    error: null,
  });

  const SORT_OPTIONS = {
    DEALS: { sortBy: "onSale", sortOrder: "desc" },
    NEWEST: { sortBy: "createdAt", sortOrder: "desc" },
    PRICE_ASC: { sortBy: "price", sortOrder: "asc" },
    PRICE_DESC: { sortBy: "price", sortOrder: "desc" },
  };
  const handleSortOptionClick = (sortOption) => {
    switch (sortOption) {
      case "DEALS":
        handleSortChange(
          SORT_OPTIONS.DEALS.sortBy,
          SORT_OPTIONS.DEALS.sortOrder
        );
        break;
      case "NEWEST":
        handleSortChange(
          SORT_OPTIONS.NEWEST.sortBy,
          SORT_OPTIONS.NEWEST.sortOrder
        );
        break;
      case "PRICE":
        // Toggle price direction
        const newDirection = priceDirection === "asc" ? "desc" : "asc";
        setPriceDirection(newDirection);
        handleSortChange("price", newDirection);
        break;
      default:
        break;
    }
  };

  const getCurrentFilters = useCallback(() => {
    return {
      page: searchParams.get("page") || initialFilters.page,
      limit: searchParams.get("limit") || initialFilters.limit,
      sortBy: searchParams.get("sortBy") || initialFilters.sortBy,
      sortOrder: searchParams.get("sortOrder") || initialFilters.sortOrder,
      minPrice: searchParams.get("minPrice") || null,
      maxPrice: searchParams.get("maxPrice") || null,
      color: searchParams.get("color") || null,
      size: searchParams.get("size") || null,
    };
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const params = getCurrentFilters();
      const data = await getProductsBySlug(slug, params);

      setState((prev) => ({
        ...prev,
        products: data.products,
        category: data.category,
        pagination: data.pagination,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err.message || "Failed to fetch products",
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [slug, getCurrentFilters]);

  useEffect(() => {
    if (slug) {
      fetchProducts();
    }
  }, [slug, searchParams, fetchProducts]);

  const handlePageChange = useCallback(
    (newPage) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", newPage);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleFilterChange = useCallback(
    (filterName, value) => {
      const newParams = new URLSearchParams(searchParams);
      if (value) {
        newParams.set(filterName, value);
      } else {
        newParams.delete(filterName);
      }
      newParams.set("page", "1");
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const handleSortChange = useCallback(
    (sortBy, sortOrder) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("sortBy", sortBy);
      newParams.set("sortOrder", sortOrder);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  if (state.loading) {
    return <Loading />;
  }

  if (state.error) {
    return <ErrorMessage message={state.error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb category={state.category} />

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-3 text-sm font-medium">
          {[
            { key: "DEALS", label: "Ưu đãi" },
            { key: "NEWEST", label: "Mới nhất" },
            { key: "PRICE", label: "Giá" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`px-2 py-1.5 rounded-md transition-all ${
                searchParams.get("sortBy")?.toUpperCase() === key
                  ? "bg-yellow-600 text-white shadow-sm"
                  : "text-gray-700 hover:text-yellow-600"
              }`}
              onClick={() => handleSortOptionClick(key)}
            >
              {label}
              {key === "PRICE" && searchParams.get("sortBy") === "price" && (
                <svg
                  className="w-4 h-4 inline-block ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={
                      searchParams.get("sortOrder") === "asc"
                        ? "M5 15l7-7 7 7"
                        : "M19 9l-7 7-7-7"
                    }
                  />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button className="p-2 border rounded-md hover:bg-gray-100">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <button className="p-2 border rounded-md hover:bg-gray-100">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <ProductGrid products={state.products} />

      {state.pagination && (
        <Pagination
          pagination={state.pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default CategoryPage;
