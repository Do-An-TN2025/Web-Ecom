import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductsBySlug } from "../services/productService";
import ProductGrid from "../components/category/ProductGrid";
import Pagination from "../components/category/Pagination";
import ErrorMessage from "../components/ErrorMessage";
import Breadcrumb from "../components/category/Breadcrumb";
import { useCategoryFilters } from "../hooks/useCategoryFilters";
import FilterSidebar from "../components/category/FilterSidebar";
import SortBar from "../components/category/SortBar";
import ActiveFiltersChips from "../components/category/ActiveFiltersChips";
import ProductGridSkeleton from "../components/category/ProductGridSkeleton";
import CategoryPills from "../components/category/CategoryPills";

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { filters, update, reset, clear, removeFromMulti } = useCategoryFilters();
  const [viewMode, setViewMode] = useState('grid');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters); // staging filters for drawer

  const [state, setState] = useState({
    products: [],
    category: null,
    pagination: null,
    facets: { colors: [], sizes: [], price: { min: 0, max: 0 } },
    loading: true,
    error: null,
  });

  const fetchProducts = useCallback(async () => {
    if (!slug) return;
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const params = { ...filters };
      const data = await getProductsBySlug(slug, params);
      // Build facets from the currently returned product set
      const colorSet = new Map(); // value -> count
      const sizeSet = new Map();
      let priceMin = Number.POSITIVE_INFINITY;
      let priceMax = 0;

      (data.products || []).forEach(p => {
        // Collect variant color + sizes
        if (Array.isArray(p.colorVariants)) {
          p.colorVariants.forEach(variant => {
            const colorKey = variant.color || variant.colorCode || '';
            if (colorKey) colorSet.set(colorKey, (colorSet.get(colorKey) || 0) + 1);
            if (Array.isArray(variant.sizes)) {
              variant.sizes.forEach(sz => {
                if (sz?.size) sizeSet.set(sz.size, (sizeSet.get(sz.size) || 0) + 1);
                const priceCandidate = (sz.discountPrice && sz.discountPrice > 0 && sz.discountPrice < (sz.price || 0))
                  ? sz.discountPrice
                  : (sz.price || sz.finalPrice || 0);
                if (priceCandidate > 0) {
                  if (priceCandidate < priceMin) priceMin = priceCandidate;
                  if (priceCandidate > priceMax) priceMax = priceCandidate;
                }
              });
            }
          });
        }
        // Fallback product-level pricing if no variant sizes
        const basePrice = p.onSale && p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price;
        if (basePrice) {
          if (basePrice < priceMin) priceMin = basePrice;
          if (basePrice > priceMax) priceMax = basePrice;
        }
      });

      if (priceMin === Number.POSITIVE_INFINITY) priceMin = 0;
      if (priceMax < priceMin) priceMax = priceMin;

      const facets = {
        colors: Array.from(colorSet.entries()).map(([value, count]) => ({ value, count })),
        sizes: Array.from(sizeSet.entries()).map(([value, count]) => ({ value, count })),
        price: { min: priceMin, max: priceMax }
      };

      setState(prev => ({ ...prev, products: data.products, category: data.category, pagination: data.pagination, facets }));
    } catch (err) {
      setState(prev => ({ ...prev, error: err.message || 'Không tải được sản phẩm' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [slug, filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Persist view mode
  useEffect(() => {
    const saved = localStorage.getItem('category:viewMode');
    if (saved === 'list' || saved === 'grid') setViewMode(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('category:viewMode', viewMode);
  }, [viewMode]);

  // Body scroll lock when drawer open
  useEffect(() => {
    if (drawerOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [drawerOpen]);

  // When opening drawer -> sync draft
  const openDrawer = () => {
    setDraftFilters(filters);
    setDrawerOpen(true);
  };

  const handleDraftChange = (partial) => {
    setDraftFilters(prev => ({ ...prev, ...partial }));
  };

  const applyDraft = () => {
    // Remove empty values so URL cleaner
    const clean = { ...draftFilters };
    ['color','size','minPrice','maxPrice'].forEach(k => {
      if (!clean[k]) delete clean[k];
    });
    update(clean);
    setDrawerOpen(false);
  };

  const resetDraft = () => {
    setDraftFilters({
      page: 1,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
  };

  const handlePageChange = (newPage) => update({ page: newPage });

  // Calculate active filter count (color values + size values + price bounds + other future facets)
  const activeFilterCount = (() => {
    let count = 0;
    if (filters.color) count += filters.color.split(',').filter(Boolean).length;
    if (filters.size) count += filters.size.split(',').filter(Boolean).length;
    if (filters.minPrice) count += 1;
    if (filters.maxPrice) count += 1;
    return count;
  })();

  if (state.error) {
    return <ErrorMessage message={state.error} />;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
      <Breadcrumb category={state.category} />
      <CategoryPills
        currentSlug={slug}
        category={state.category}
        onNavigate={(s) => navigate(`/category/${s}`)}
      />

      <header className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{state.category?.name || 'Danh mục'}</h1>
        {state.category?.description && (
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-600">{state.category.description}</p>
        )}
        {state.pagination?.total && (
          <p className="text-xs text-zinc-400">{state.pagination.total} sản phẩm</p>
        )}
      </header>

      <div className="flex flex-col">
        <section className="w-full">
          <div className="sticky top-20 z-20 -mx-4 mb-4 border-b border-transparent bg-white/80 px-4 pb-3 pt-2 backdrop-blur supports-[backdrop-filter]:bg-white/70 md:static md:top-auto md:mx-0 md:px-0 md:pt-0">
            <SortBar
              filters={filters}
              onSortChange={(sortBy, sortOrder) => update({ sortBy, sortOrder })}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenFilters={openDrawer}
              filterCount={activeFilterCount}
            />
            <ActiveFiltersChips
              filters={filters}
              onClearAll={reset}
              onClear={clear}
              removeFromMulti={removeFromMulti}
            />
          </div>

          {state.loading ? (
            <ProductGridSkeleton viewMode={viewMode} />
          ) : state.products.length ? (
            <ProductGrid products={state.products} viewMode={viewMode} />
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 p-12 text-center">
              <p className="text-sm font-medium text-zinc-600">Không có sản phẩm phù hợp bộ lọc hiện tại.</p>
              <button
                onClick={reset}
                className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >Xóa bộ lọc</button>
            </div>
          )}

          {state.pagination && state.pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination pagination={state.pagination} onPageChange={handlePageChange} />
            </div>
          )}
        </section>
      </div>

      {/* Unified Filter Drawer (slides from right, all breakpoints) */}
      <div className={`fixed inset-0 z-50 transition ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'} `} aria-hidden={!drawerOpen}>
        {/* Backdrop */}
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          className={`absolute right-0 top-0 h-full w-full max-w-md transform bg-white shadow-xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-700">Bộ lọc</h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Đóng bộ lọc"
            >
              ✕
            </button>
          </div>
          <div className="h-[calc(100%-140px)] overflow-y-auto px-5 py-5">
            <FilterSidebar
              filters={draftFilters}
              onChange={handleDraftChange}
              facets={state.facets}
              onClose={() => setDrawerOpen(false)}
              isMobile
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-100 bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={resetDraft}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
              >Xóa hết</button>
              <button
                onClick={applyDraft}
                className="rounded-full bg-yellow-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={state.loading}
              >Áp dụng</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CategoryPage;
