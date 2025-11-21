import { useState, useCallback } from "react";
import resolveImage from '../../helpers/imageUtils';

export default function SearchResultsMenu({
  results = [],
  onItemClick,
  loading,
  debouncing,
  searchQuery
}) {
  const [selectedColors, setSelectedColors] = useState({});
  const handleColorClick = useCallback((pid, idx, e) => {
    e.stopPropagation();
    setSelectedColors(prev => ({ ...prev, [pid]: idx }));
  }, []);

  return (
    <div
      onMouseDown={e => {
        if (!["A","BUTTON","INPUT","TEXTAREA"].includes(e.target.tagName)) {
          e.preventDefault(); // giữ focus input nhưng không ép refocus
        }
      }}
      className="absolute left-0 right-0 top-full z-40 bg-white border-b border-gray-100 shadow-sm px-4 pb-4 pt-2"
    >
      <div className="mb-2 text-sm">
        Kết quả tìm kiếm cho <span className="font-semibold text-red-600">"{searchQuery}"</span>
      </div>
      {loading || debouncing ? (
        <div className="py-4 text-sm text-gray-500">Đang tìm...</div>
      ) : results.length === 0 ? (
        <div className="py-4 text-sm text-gray-500">Không có sản phẩm.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map(p => {
            const idx = selectedColors[p._id] || 0;
            const variant = p.colorVariants?.[idx];
            const main = variant?.images?.[0] || p.thumbnail;
            const hover = variant?.images?.[1] || main;
            return (
              <div
                key={p._id}
                role="button"
                tabIndex={-1}
                onClick={() => onItemClick && onItemClick(p.slug)}
                className="text-left group border rounded-lg overflow-hidden hover:shadow-sm transition bg-white cursor-pointer"
              >
                <div className="aspect-square bg-gray-50">
                  {main && (
                    <img
                      src={resolveImage(main)}
                      onMouseEnter={e => hover && (e.currentTarget.src = resolveImage(hover))}
                      onMouseLeave={e => main && (e.currentTarget.src = resolveImage(main))}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="p-2">
                  <div className="line-clamp-2 text-xs font-medium text-gray-700 group-hover:text-gray-900">
                    {p.name}
                  </div>
                  {p.price != null && (
                    <div className="mt-1 text-[11px] font-semibold text-red-600">
                      {p.price.toLocaleString()}đ
                    </div>
                  )}
                  {p.colorVariants?.length > 1 && (
                    <div className="mt-1 flex gap-1">
                      {p.colorVariants.slice(0,4).map((c,i)=>(
                        <span
                          key={i}
                          onClick={(e)=>handleColorClick(p._id, i, e)}
                          className={`h-3 w-3 rounded-full border ${
                            i===idx ? "ring-2 ring-black" : ""
                          }`}
                          style={{ backgroundColor: c.colorHex || "#ddd" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}