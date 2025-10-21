import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Search, X, Heart, Menu } from "lucide-react";
import { getCategories } from "../../services/categoryService";
import { searchProducts } from "../../services/productService";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../../hooks/useWishlist";
import Logo from "../../components/Logo";
import CategoryMenu from "./CategoryMenu";
import SearchResultsMenu from "./SearchResultsMenu";
import UserMenu from "./UserMenu";
import CartButton from "./CartButton";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, items } = useCart();
  const { count: wishlistCount , refresh } = useWishlist();
  useEffect(() => { 
    refresh();
  }, [refresh]);

  const [scrolled, setScrolled] = useState(false);
  const [mode, setMode] = useState("none"); // none | categories | search
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const headerRef = useRef(null);
  const scrollRef = useRef(window.scrollY);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const isSearching = isDebouncing || isLoading;
  const showCategoryPanel = mode === "search" && !hasQuery;
  const showResultsPanel = mode === "search" && hasQuery && !isSearching;

  const miniSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      if (mode === "search" && y > scrollRef.current + 50) {
        closeSearch();
      }
      scrollRef.current = y;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mode]);

  useEffect(() => {
    setMode("none");
    setQuery("");
    setResults([]);
  }, [location.pathname]);

  // Lock body scroll when an overlay (search or categories) is open on mobile to prevent background scroll.
  useEffect(() => {
    if (mode !== "none") {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [mode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!headerRef.current || headerRef.current.contains(event.target)) return;
      closeSearch();
      setMode("none");
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        openSearch(true);
      }
      if (event.key === "Escape") {
        closeSearch();
        setMode("none");
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!hasQuery) {
      setResults([]);
      setIsDebouncing(false);
      setIsLoading(false);
      return;
    }

    setResults([]);
    setIsDebouncing(true);
    const controller = new AbortController();
    abortRef.current = controller;

    debounceRef.current = setTimeout(async () => {
      setIsDebouncing(false);
      setIsLoading(true);
      try {
        const response = await searchProducts({ q: trimmedQuery }, { signal: controller.signal });
        setResults(response?.products || []);
      } catch (error) {
        if (error.name !== "AbortError") setResults([]);
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [trimmedQuery]);

  const openCategories = useCallback(() => {
    setMode((prev) => (prev === "categories" ? "none" : "categories"));
  }, []);

  const openSearch = useCallback(
    (focus = false) => {
      setMode("search");
      if (focus) requestAnimationFrame(() => inputRef.current?.focus());
    },
    []
  );

  const clearQuery = () => {
    setQuery("");
    setResults([]);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const closeSearch = useCallback(() => {
    setMode("none");
    setQuery("");
    setResults([]);
    setIsDebouncing(false);
    setIsLoading(false);
    abortRef.current?.abort();
  }, []);

  const handleCategoryClick = useCallback(
    (slug) => {
      closeSearch();
      navigate(`/category/${slug}`);
    },
    [closeSearch, navigate]
  );

  const handleProductClick = useCallback(
    (slug) => {
      closeSearch();
      navigate(`/product/${slug}`);
    },
    [closeSearch, navigate]
  );

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 border-b bg-white transition-shadow ${
          scrolled || mode !== "none" ? "shadow-lg" : "shadow-sm"
        }`}
      > 
        <div className="mx-auto relative flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:h-20 md:gap-4 md:px-6">
          {/* Left: Mobile menu button (desktop: shares space with logo area) */}
          <div className="flex items-center md:gap-3">
            <button
              onClick={openCategories}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:border-yellow-400 hover:bg-yellow-50 md:hidden"
              aria-label="Mở danh mục"
              aria-expanded={mode === "categories"}
              aria-controls="category-panel"
              type="button"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Center: Logo (absolutely centered on mobile, normal flow on md+) */}
          <Link
            to="/"
            className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center md:static md:translate-x-0 md:translate-y-0"
            aria-label="Trang chủ"
          >
            <Logo width={140} height={38} />
          </Link>

          <button
            onClick={openCategories}
            className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-yellow-400 hover:bg-yellow-50 md:inline-flex"
            aria-label="Danh mục"
            aria-expanded={mode === "categories"}
            aria-controls="category-panel"
            type="button"
          >
            <Menu className="h-4 w-4" />
            Danh mục
          </button>

          {/* Desktop / Tablet search bar */}
          <div className="hidden min-w-0 flex-1 md:block">
            <div
              className={`group relative flex items-center rounded-full border border-transparent bg-zinc-100 pl-5 pr-3 transition ${
                mode === "search" ? "ring-2 ring-yellow-400" : "hover:bg-zinc-200"
              }`}
            >
              <Search className="mr-3 h-5 w-5 text-zinc-400" />
              <input
                ref={inputRef}
                id="main-search-input"
                type="text"
                value={query}
                onFocus={() => openSearch()}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm kiếm sản phẩm "
                className="h-11 w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                autoComplete="off"
                aria-label="Tìm kiếm sản phẩm"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearQuery}
                  className="rounded-full p-2 text-zinc-400 transition hover:bg-white hover:text-zinc-600"
                  aria-label="Xóa tìm kiếm"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-500" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right: actions (User + Cart) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/wishlist")}
              className="relative hidden h-11 w-11 items-center justify-center rounded-full border border-transparent text-zinc-600 transition hover:border-rose-200 hover:bg-yellow-50 hover:text-yellow-500 sm:flex"
              aria-label="Yêu thích"
              type="button"
            >
              <Heart className="h-7 w-7" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </button>
            <div className="hidden md:block"><UserMenu /></div>
            {/* Show user menu inline on mobile as requested */}
            <div className="md:hidden"><UserMenu /></div>

            <div className="relative">
              <CartButton onClick={() => navigate("/cart")} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 rounded-full bg-yellow-400 px-1.5 text-[10px] font-semibold text-zinc-900">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </div>
          </div>
        </div>

        {(mode === "categories" || showCategoryPanel) && (
          <div id="category-panel">
            <CategoryMenu
              categories={categories}
              show
              setShow={closeSearch}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        )}

        {/* Mobile search completely removed per new layout requirement */}

        {showResultsPanel && (
          <SearchResultsMenu
            results={results}
            onItemClick={handleProductClick}
            loading={false}
            debouncing={false}
            searchQuery={trimmedQuery}
          />
        )}

        {mode === "search" && hasQuery && isSearching && (
          <div
            className="absolute left-0 right-0 top-full z-40 bg-white px-4 py-3 text-sm text-zinc-500 shadow-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="mx-auto flex max-w-7xl items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500" />
              Đang tìm kiếm...
            </div>
          </div>
        )}
      </header>
      {mode !== "none" && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
          onClick={() => setMode("none")}
          role="presentation"
        />
      )}

      {totalItems > 0 && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-40 hidden rounded-full bg-black/85 px-4 py-2 text-xs font-medium text-white shadow md:block">
          {totalItems} sp • {miniSubtotal.toLocaleString()}đ
        </div>
      )}
    </>
  );
}