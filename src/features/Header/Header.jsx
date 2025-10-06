import { useEffect, useState, useRef } from "react";
import { getCategories } from "../../services/categoryService";
import { searchProducts } from "../../services/productService";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Logo from "../../components/Logo";
import CategoryMenu from "./CategoryMenu";
import SearchBar from "./SearchBar";
import CartButton from "./CartButton";
import SearchResultsMenu from "./SearchResultsMenu";
import SearchLoading from "../../components/SearchLoading";
import UserMenu from "./UserMenu";
import { useCart } from "../../contexts/CartContext";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [isDebouncing, setIsDebouncing] = useState(false)

  const [user, setUser] = useState(null);
  const { totalItems, items } = useCart();
  const wrapperRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setLoadingSearch(false);
      setShowSearchResults(false);
      setIsDebouncing(false)
      return;
    }

    // Hủy timeout trước đó nếu có
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setIsDebouncing(true);
    abortControllerRef.current = new AbortController();

    searchTimeoutRef.current = setTimeout(async () => {
      setIsDebouncing(false);
      setLoadingSearch(true);
      try {
        const data = await searchProducts({ 
          q: searchQuery 
        }, { 
          signal: abortControllerRef.current.signal 
        });
        
        setSearchResults(data?.products || []);
        setShowSearchResults(true);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Error searching products", err);
          setSearchResults([]);
        }
      } finally {
        setLoadingSearch(false);
        abortControllerRef.current = null;
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Error loading categories", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryClick = (slug) => {
    setShowCategoryMenu(false);
    setShowSearchResults(false);
    navigate(`/category/${slug}`);
  };

  const handleProductClick = (slug) => {
    setShowCategoryMenu(false);
    setShowSearchResults(false);
    setSearchQuery("");
    navigate(`/product/${slug}`);
  };

  const handleSearchFocus = () => {
    setShowCategoryMenu(true);
  };

  const handleCloseSearchResults = () => {
    setSearchQuery("");
    setShowCategoryMenu(false);
    setShowSearchResults(false);
  };

  // Đóng menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowCategoryMenu(false);
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isCategoryPage = location.pathname.startsWith("/category");

  // Mini subtotal (optional)
  const miniSubtotal = items.reduce((s, it) => s + it.price * it.qty, 0);

  const shouldShowSearchResults = (showSearchResults || isDebouncing || loadingSearch) && searchQuery.trim();

  return (
    <>
      <header
        ref={wrapperRef}
        role="navigation"
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled || showCategoryMenu || showSearchResults
            ? "bg-white shadow border-b"
            : "bg-transparent"
        }`}
      >
        <div
          className={`transition-all duration-300 ${
            showCategoryMenu || showSearchResults
              ? "h-16 border-b border-gray-200"
              : scrolled
              ? "h-16"
              : "h-20"
          }`}
        >
          <div className="container mx-auto px-4 flex items-center justify-between h-full gap-6">
            {/* Category Toggle */}
            <div className="w-1/3">
              <button
                aria-expanded={showCategoryMenu}
                aria-controls="category-menu"
                className={`flex items-center gap-2 px-2 py-1 rounded-lg border font-medium transition-colors text-sm md:text-base md:px-3 md:py-2 ${
                  isCategoryPage ? "border-yellow-500 text-yellow-600 bg-yellow-50" : "bg-white text-black hover:bg-gray-100"
                }`}
                onClick={() => {
                  setShowCategoryMenu((prev) => !prev);
                  setShowSearchResults(false);
                }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                <span className="hidden md:inline">DANH MỤC</span>
                <svg
                  className={`hidden md:inline w-4 h-4 transition-transform ${
                    showCategoryMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>

            {/* Logo */}
            <div className="w-1/3 flex justify-center items-center md:flex-none">
              <Link to="/" aria-label="Trang chủ">
                <Logo width={180} height={40} />
              </Link>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3 md:gap-5">
              <SearchBar
                onSearch={setSearchQuery}
                onFocus={handleSearchFocus}
                aria-label="Tìm kiếm sản phẩm"
              />
              {/* Wishlist (placeholder) */}
              <Link
                to="/wishlist"
                className="relative p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Yêu thích"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
                {/* <span className="absolute -top-1 -right-1 bg-pink-600 text-white rounded-full text-[10px] px-1">3</span> */}
              </Link>

              <UserMenu />

              {/* Cart */}
              <div className="relative">
                <CartButton onClick={() => navigate("/cart")} />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] text-center"
                    aria-label={`Có ${totalItems} sản phẩm trong giỏ`}
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
                {/* Mini subtotal hover */}
                {totalItems > 0 && (
                  <div className="absolute hidden md:block opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition top-full right-0 mt-2 bg-white shadow-lg border rounded-lg p-3 w-52 text-xs">
                    <p className="font-medium mb-1">
                      {totalItems} sản phẩm
                    </p>
                    <p className="text-yellow-600 font-semibold">
                      {miniSubtotal.toLocaleString()}đ
                    </p>
                    <button
                      onClick={() => navigate("/cart")}
                      className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 rounded-md text-xs font-semibold"
                    >
                      Xem giỏ
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {showCategoryMenu && (
          shouldShowSearchResults ? (
            <SearchResultsMenu
              results={searchResults}
              onItemClick={handleProductClick}
              loading={loadingSearch}
              debouncing={isDebouncing}
              onClose={handleCloseSearchResults}
              searchQuery={searchQuery}
            />
          ) : (
            <CategoryMenu
              id="category-menu"
              categories={categories}
              show={showCategoryMenu}
              setShow={setShowCategoryMenu}
              onCategoryClick={handleCategoryClick}
            />
          )
        )}
      </header>
      <div
        className={`transition-all duration-300 ${
          showCategoryMenu || showSearchResults
            ? "h-32"
            : scrolled
            ? "h-16"
            : "h-20"
        }`}
      />
    </>
  );
}