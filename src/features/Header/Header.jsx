import { useEffect, useState, useRef } from "react";
import { getCategories } from "../../services/categoryService";
import { searchProducts } from "../../services/productService";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/Logo";
import CategoryMenu from "./CategoryMenu";
import SearchBar from "./SearchBar";
import CartButton from "./CartButton";
import SearchResultsMenu from "./SearchResultsMenu";
import SearchLoading from "../../components/SearchLoading";
import UserMenu from "./UserMenu";

export default function Header() {
  const navigate = useNavigate();
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

 const shouldShowSearchResults = (showSearchResults || isDebouncing || loadingSearch) && searchQuery.trim();

  return (
    <>
      {/* Main Header */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all md:justify-around duration-300 ${
          scrolled || showCategoryMenu || showSearchResults
            ? "bg-white shadow border-b" 
            : "bg-transparent"
        }`}
      >
        {/* Top Bar - Logo, Search, Cart */}
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
            {/* Category Toggle Button */}
            <div className="w-1/3">
  <button
    className="flex items-center gap-2 px-2 py-1 rounded-lg border bg-white text-black font-medium hover:bg-gray-100 transition-colors text-sm md:text-base md:px-3 md:py-2"
    onClick={() => {
      setShowCategoryMenu((prev) => !prev);
      setShowSearchResults(false);
    }}
  >
    {/* Icon luôn hiện */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>

    {/* Text chỉ hiện từ md trở lên */}
    <span className="hidden md:inline">DANH MỤC</span>

    {/* Arrow chỉ hiện từ md trở lên */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`hidden md:inline w-4 h-4 transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`}
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
              <a href="/"><Logo width={180} height={40} /></a>
            </div>

            {/* Search + Cart */}
            <div className="flex items-center gap-3 md:gap-5">
            <SearchBar onSearch={setSearchQuery} onFocus={handleSearchFocus} />
            <UserMenu/>         
            <CartButton onClick={() => navigate("/cart")} />
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
              categories={categories}
              show={showCategoryMenu}
              setShow={setShowCategoryMenu}
              onCategoryClick={handleCategoryClick}
            />
          )
        )}
      </header>

      {/* Spacer */}
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