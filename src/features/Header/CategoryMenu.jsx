import { useRef, useEffect } from "react";

export default function CategoryMenu({ categories, show, setShow, onCategoryClick }) {
  const menuRef = useRef(null);

  const groupedCategories = {
    nam: categories.filter((cat) => cat.path?.startsWith("nam")),
    nu: categories.filter((cat) => cat.path?.startsWith("nu")),
    "tre-em": categories.filter((cat) => cat.path?.startsWith("tre-em")),
  };

  const groupTitles = {
    nam: "NAM",
    nu: "NỮ",
    "tre-em": "TRẺ EM",
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (show && menuRef.current && !menuRef.current.contains(e.target)) {
        // Check if click is not on the category button itself
        const categoryButton = document.querySelector('[data-category-button]');
        if (categoryButton && !categoryButton.contains(e.target)) {
          setShow(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, setShow]);

  if (!show) return null;

  return (
    <div
      ref={menuRef}
      className="w-full bg-white shadow-lg border-t border-gray-200 px-8 py-6"
    >
      <div className="container mx-auto">
        <div className="grid grid-cols-3 gap-12">
          {Object.keys(groupedCategories).map((group) => (
            <div key={group}>
              {/* Group Title */}
              <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b-2 border-red-600 text-lg uppercase tracking-wide">
                {groupTitles[group]}
              </h3>

              {/* Category Items */}
              <div className="space-y-2">
                {groupedCategories[group].map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => onCategoryClick(cat.slug)}
                    className="block text-left w-full py-2 px-3 text-gray-700 hover:text-red-600 hover:bg-gray-50 transition-all duration-200 rounded-md text-sm font-medium"
                  >
                    {cat.name}
                  </button>
                ))}
                
                {/* View All Link */}
                <button
                  onClick={() => onCategoryClick(group)}
                  className="block text-left w-full py-2 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 rounded-md text-sm font-semibold border-t border-gray-100 mt-3 pt-3"
                >
                  Xem tất cả {groupTitles[group].toLowerCase()} →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
          <div className="flex gap-6 text-sm text-gray-600">
            <button className="hover:text-red-600 transition-colors">Khuyến mãi hot</button>
            <button className="hover:text-red-600 transition-colors">Sản phẩm mới</button>
            <button className="hover:text-red-600 transition-colors">Bán chạy nhất</button>
          </div>
          
          <button
            onClick={() => setShow(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}