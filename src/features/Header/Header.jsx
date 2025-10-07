import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getCategories } from "../../services/categoryService";
import { searchProducts } from "../../services/productService";
import { useCart } from "../../contexts/CartContext";
import Logo from "../../components/Logo";
import CategoryMenu from "./CategoryMenu";
import SearchResultsMenu from "./SearchResultsMenu";
import UserMenu from "./UserMenu";
import CartButton from "./CartButton";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, items } = useCart();

  // UI state
  const [scrolled, setScrolled] = useState(false);
  const [mode, setMode] = useState("none"); // 'none' | 'categories' | 'search'
  const [categories, setCategories] = useState([]);

  // Search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [debouncing, setDebouncing] = useState(false);
  const searchTimerRef = useRef(null);
  const abortRef = useRef(null);

  // User (tối giản)
  const [user, setUser] = useState(null);

  const headerRef = useRef(null);

  /* ---------- Effects ---------- */
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  // Close overlays when route changes
  useEffect(() => {
    setMode("none");
    setQuery("");
  }, [location.pathname]);

  // Outside click
  useEffect(() => {
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMode("none");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Shortcut "/"
  useEffect(() => {
    const keyHandler = (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setMode("search");
        const inp = document.getElementById("main-search-input");
        inp?.focus();
      }
      if (e.key === "Escape") {
        setMode("none");
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    if (!query.trim()) {
      setResults([]);
      setLoadingSearch(false);
      setDebouncing(false);
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setDebouncing(true);
    abortRef.current = new AbortController();
    searchTimerRef.current = setTimeout(async () => {
      setDebouncing(false);
      setLoadingSearch(true);
      try {
        const data = await searchProducts(
          { q: query },
            { signal: abortRef.current.signal }
        );
        setResults(data?.products || []);
      } catch (err) {
        if (err.name !== "AbortError") setResults([]);
      } finally {
        setLoadingSearch(false);
        abortRef.current = null;
      }
    }, 450);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [query]);

  /* ---------- Helpers ---------- */
  const miniSubtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const isCatPage = location.pathname.startsWith("/category");

  const openCategories = () => {
    setMode((m) => (m === "categories" ? "none" : "categories"));
  };
  const openSearch = () => {
    setMode("search");
    setTimeout(() => {
      document.getElementById("main-search-input")?.focus();
    }, 0);
  };
  const clearAndCloseSearch = () => {
    setQuery("");
    setMode("none");
  };

  const handleCategoryClick = useCallback(
    (slug) => {
      setMode("none");
      navigate(`/category/${slug}`);
    },
    [navigate]
  );

  const handleProductClick = useCallback(
    (slug) => {
      setMode("none");
      setQuery("");
      navigate(`/product/${slug}`);
    },
    [navigate]
  );

  const showSearchPanel =
    mode === "search" && (query.trim() || debouncing || loadingSearch);

  /* ---------- UI Sub Components ---------- */
  const SearchInput = () => (
    <div
      className={`relative flex w-full items-center rounded-xl border bg-white transition focus-within:ring-2 focus-within:ring-black/50
        ${mode === "search" ? "border-black/50" : "border-gray-200"}`}
    >
      <span className="px-3 text-gray-400">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.8-4.8m0 0A7.2 7.2 0 1010.2 17.4z" />
        </svg>
      </span>
      <input
        id="main-search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm sản phẩm... ( / )"
        className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        onFocus={() => setMode("search")}
        autoComplete="off"
        aria-label="Tìm kiếm sản phẩm"
      />
      {(query || debouncing || loadingSearch) && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            const inp = document.getElementById("main-search-input");
            inp?.focus();
          }}
          className="px-3 text-gray-400 hover:text-gray-600"
          aria-label="Xóa tìm kiếm"
        >
          {loadingSearch ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 100 16v4l3.5-3.5L12 20v4a8 8 0 01-8-8z"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      )}
    </div>
  );

  /* ---------- Render ---------- */
  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors ${
          scrolled || mode !== "none"
            ? "bg-white/95 backdrop-blur shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 md:gap-5 md:px-6">
          {/* Mobile: left cluster */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={openCategories}
              aria-label="Mở danh mục"
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                mode === "categories"
                  ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500`}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

          {/* Logo */}
          <div className="flex flex-1 justify-start md:w-auto md:flex-none">
            <Link to="/" className="inline-flex items-center" aria-label="Trang chủ">
              <Logo width={150} height={38} />
            </Link>
          </div>

            {/* Desktop Search + Category */}
          <div className="hidden flex-1 items-center gap-3 md:flex">
            <button
              onClick={openCategories}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                mode === "categories" || isCatPage
                  ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500`}
              aria-expanded={mode === "categories"}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <span>Danh mục</span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  mode === "categories" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div className="flex-1">
              <SearchInput />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Mobile search icon */}
            <button
              onClick={openSearch}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 md:hidden"
              aria-label="Tìm kiếm"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.8-4.8m0 0A7.2 7.2 0 1010.2 17.4z" />
              </svg>
            </button>

            <Link
              to="/wishlist"
              aria-label="Yêu thích"
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 md:flex"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </Link>

            <UserMenu />

            <div className="relative">
              <CartButton onClick={() => navigate("/cart")} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search bar slide */}
        <div
          className={`md:hidden transition-[max-height,opacity] duration-300 ${
            mode === "search" ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden px-3 pb-3`}
        >
          <SearchInput />
        </div>

        {/* Category Menu (desktop & mobile) */}
        {mode === "categories" && (
          <CategoryMenu
            categories={categories}
            show={true}
            setShow={() => setMode("none")}
            onCategoryClick={handleCategoryClick}
          />
        )}

        {/* Search Results Overlay */}
        {showSearchPanel && (
          <SearchResultsMenu
            results={results}
            onItemClick={handleProductClick}
            loading={loadingSearch}
            debouncing={debouncing}
            onClose={clearAndCloseSearch}
            searchQuery={query}
          />
        )}
      </header>

      {/* Spacer */}
      <div className="h-16" />

      {/* Optional dim backdrop when overlays open */}
      {mode !== "none" && (
        <div
          onClick={() => setMode("none")}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] md:bg-black/10"
        />
      )}

      {/* Mini subtotal tooltip (optional simple) */}
      {totalItems > 0 && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-40 hidden rounded-full bg-black/80 px-4 py-2 text-xs font-medium text-white shadow md:block">
          {totalItems} sp • {miniSubtotal.toLocaleString()}đ
        </div>
      )}
    </>
  );
}