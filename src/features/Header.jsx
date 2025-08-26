import { useEffect, useState, useRef } from "react";
import InputSearch from "../components/InputSearch";

export default function Header() {
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const categoryRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50 || showCategoryMenu || showSearchMenu);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  },[showCategoryMenu, showSearchMenu]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const toggleCategory = () => {
    setShowCategoryMenu(!showCategoryMenu);
    setScrolled(true);
  };

  const handleSearchFocus = () => {
    setShowSearchMenu(true);
    setScrolled(true);
  };
  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow border-b h-16" : "bg-transparent h-20"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-full px-6 gap-6">
        {/* Danh mục */}
        <div className="w-1/3 relative" ref={categoryRef}>
          <button
            className="flex bg-white items-center gap-2 border px-4 py-2 rounded-md text-sm text-gray hover:bg-gray-100"
            aria-label="Toggle menu"
            onClick={() => setShowCategoryMenu(toggleCategory)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            Danh mục
          </button>

        </div>

        {/* Logo */}
        <div className="w-1/3">
          <div className="text-2xl center font-bold text-yellow-600">ShoppingNOW</div>
        </div>

        {/* Search + Cart */}
        <div className="flex items-center gap-5 w-1/5">
          <div className="relative w-full" ref={searchRef}>
            <InputSearch
              placeholder="Tìm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowSearchMenu(true)}
            />
            
            {showSearchMenu && search && (
              <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-lg mt-1">
                <div className="p-4">
                  <h4 className="text-sm text-gray-500 mb-2">Gợi ý tìm kiếm</h4>
                  <ul className="space-y-2">
                    <li className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">Áo thun nam</li>
                    <li className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">Áo khoác nữ</li>
                    <li className="px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">Quần jean nam</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <a href="/cart" aria-label="Cart" className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-8 h-8 text-black font-bold hover:text-gray-600 transition-colors duration-200"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          </a>
        </div>
      </div>
      {showCategoryMenu && (
<div className="absolute top-full left-0 w-full bg-white shadow-lg mt-1"
       style={{left: '50%', transform: 'translateX(-50%)'}}>
    <div className="max-w-7xl mx-auto grid grid-cols-3 p-6">
      <div className="space-y-4">
        <h3 className="font-medium text-lg">NAM</h3>
        <ul className="space-y-2">
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Áo khoác nam</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Áo nam</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Quần nam</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Đồ thể thao nam</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Đồ mặc trong & Đồ lót nam</a></li>
        </ul>
      </div>
      <div className="space-y-4">
        <h3 className="font-medium text-lg">NỮ</h3>
        <ul className="space-y-2">
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Áo khoác nữ</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Áo nữ</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Quần nữ</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Đồ thể thao nữ</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Đồ mặc trong & Đồ lót nữ</a></li>
        </ul>
      </div>
      <div className="space-y-4">
        <h3 className="font-medium text-lg">TRẺ EM</h3>
        <ul className="space-y-2">
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Áo khoác trẻ em</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Áo trẻ em</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Quần trẻ em</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Đồ mặc trong trẻ em</a></li>
          <li><a href="#" className="text-gray-600 hover:text-yellow-600">Sản phẩm khác</a></li>
        </ul>
      </div>
    </div>
  </div>
)}
    </header>
  );
}