import { useRef, useEffect, useState, useCallback } from "react";

export default function CategoryMenu({ categories, show, setShow, onCategoryClick }) {
  const menuRef = useRef(null);
  const [openGroups, setOpenGroups] = useState({ nam: true, nu: true, "tre-em": true , khac: true});

  const groupedCategories = {
    nam: categories.filter((cat) => cat.path?.startsWith("nam")),
    nu: categories.filter((cat) => cat.path?.startsWith("nu")),
    "tre-em": categories.filter((cat) => cat.path?.startsWith("tre-em")),
    khac: categories.filter((cat) => {
      return !cat.path?.startsWith("nam") && !cat.path?.startsWith("nu") && !cat.path?.startsWith("tre-em");
    }),
  };

  const groupTitles = {
    nam: "NAM",
    nu: "NỮ",
    "tre-em": "TRẺ EM",
    khac : "KHÁC",
  };

  // Close when clicking outside (desktop scenario mainly)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!show) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        const categoryButton = document.querySelector('[data-category-button]');
        if (categoryButton && categoryButton.contains(e.target)) return;
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, setShow]);

  // Collapse groups on small screens by default (optional behavior)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    if (mq.matches) {
      // Collapse all groups on small screens by default, including `khac`
      setOpenGroups({ nam: false, nu: false, "tre-em": false, khac: false });
    }
  }, []);

  const toggleGroup = useCallback((key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  if (!show) return null;

  return (
    <div
      ref={menuRef}
      className="w-full border-t border-gray-200 bg-white shadow-lg md:static md:max-h-none md:rounded-none md:px-8 md:py-6 md:shadow-lg"
      role="dialog"
      aria-label="Danh mục sản phẩm"
    >
      {/* Mobile top bar */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <h2 className="text-sm font-semibold text-gray-700">Danh mục</h2>
        <button
          onClick={() => setShow(false)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Đóng danh mục"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-4 md:container md:px-0 md:pb-0">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-12">
          {Object.keys(groupedCategories).map((group) => {
            const isOpen = openGroups[group];
            const items = groupedCategories[group];
            return (
              <div key={group} className="border-b border-gray-100 pb-2 md:border-none md:pb-0">
                {/* Group Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-2 py-2 text-left md:cursor-default md:py-0"
                  disabled={items.length === 0}
                >
                  <span className="font-bold tracking-wide text-gray-900 md:mb-4 md:block md:border-b-2 md:border-red-600 md:pb-2 md:text-lg md:uppercase">
                    {groupTitles[group]}
                  </span>
                  <span className="md:hidden text-gray-500">
                    <svg
                      className={`h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {/* Items */}
                <div
                  className={`${isOpen ? 'block' : 'hidden'} space-y-1 pt-1 md:block md:space-y-2 md:pt-0`}
                >
                  {items.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => onCategoryClick(cat.slug)}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50 hover:text-red-600"
                    >
                      {cat.name}
                    </button>
                  ))}
                  <button
                    onClick={() => onCategoryClick(group)}
                    className="mt-2 block w-full rounded-md border-t border-gray-100 px-3 pt-3 text-left text-sm font-semibold text-red-600 transition-all duration-150 hover:bg-red-50 hover:text-red-700 md:mt-3"
                  >
                    Xem tất cả {groupTitles[group].toLowerCase()} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom actions (desktop only) */}
        <div className="mt-6 hidden items-center justify-between border-t border-gray-200 pt-6 md:flex">
          <div className="flex gap-6 text-sm text-gray-600">
            <button className="transition-colors hover:text-red-600">Khuyến mãi hot</button>
            <button className="transition-colors hover:text-red-600">Sản phẩm mới</button>
            <button className="transition-colors hover:text-red-600">Bán chạy nhất</button>
          </div>
          <button
            onClick={() => setShow(false)}
            className="text-gray-500 transition-colors hover:text-gray-700"
            aria-label="Đóng danh mục"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}