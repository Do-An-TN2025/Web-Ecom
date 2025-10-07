import React, { useState, useEffect } from 'react';

// Simple reusable section wrapper
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-100 pb-4 last:border-none">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between py-2 text-left text-sm font-semibold text-zinc-700 hover:text-yellow-600"
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      <div className={`${open ? 'mt-2 space-y-2' : 'hidden'}`}>{children}</div>
    </div>
  );
}

export default function FilterSidebar({ filters, onChange, onClose, isMobile = false, facets }) {
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');

  // Sync external changes (e.g., reset)
  useEffect(() => { setMinPrice(filters.minPrice || ''); }, [filters.minPrice]);
  useEffect(() => { setMaxPrice(filters.maxPrice || ''); }, [filters.maxPrice]);

  const applyPrice = () => {
    onChange({ minPrice: minPrice || null, maxPrice: maxPrice || null });
  };

  const clearPrice = () => {
    setMinPrice('');
    setMaxPrice('');
    onChange({ minPrice: null, maxPrice: null });
  };

  // Multi-select: parse existing values (comma separated)
  const selectedColors = (filters.color ? filters.color.split(',') : []).filter(Boolean);
  const selectedSizes = (filters.size ? filters.size.split(',') : []).filter(Boolean);

  const toggleMulti = (key, list, value) => {
    const exists = list.includes(value);
    const next = exists ? list.filter(v => v !== value) : [...list, value];
    onChange({ [key]: next.length ? next.join(',') : null });
  };

  const colors = facets?.colors?.length ? facets.colors : [];
  const sizes = facets?.sizes?.length ? facets.sizes : [];
  const priceFacet = facets?.price;

  return (
    <div className={isMobile ? '' : 'sticky top-24'}>
      {isMobile && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">Bộ lọc</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
          >
            ✕
          </button>
        </div>
      )}
      <div className="space-y-4">
        <Section title="Giá" defaultOpen>
          {priceFacet && (
            <div className="mb-2 space-y-1 text-[11px] text-zinc-500">
              <div>Khoảng giá trong kết quả: {priceFacet.min.toLocaleString()}đ – {priceFacet.max.toLocaleString()}đ</div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-zinc-400">
                <span>Min: {minPrice || priceFacet.min}</span>
                <span>Max: {maxPrice || priceFacet.max}</span>
              </div>
            </div>
          )}
          {priceFacet && (
            <div className="mb-3 space-y-3">
              <div className="relative flex items-center gap-2">
                <input
                  type="range"
                  min={priceFacet.min}
                  max={priceFacet.max}
                  value={minPrice || priceFacet.min}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!maxPrice || val <= Number(maxPrice)) setMinPrice(String(val));
                  }}
                  className="w-full accent-yellow-500"
                />
                <input
                  type="range"
                  min={priceFacet.min}
                  max={priceFacet.max}
                  value={maxPrice || priceFacet.max}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!minPrice || val >= Number(minPrice)) setMaxPrice(String(val));
                  }}
                  className="w-full accent-yellow-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Từ"
                  value={minPrice}
                  min={priceFacet.min}
                  max={priceFacet.max}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm focus:border-yellow-500 focus:outline-none"
                />
                <span className="text-xs text-zinc-400">-</span>
                <input
                  type="number"
                  placeholder="Đến"
                  value={maxPrice}
                  min={priceFacet.min}
                  max={priceFacet.max}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>
          )}
          {!priceFacet && (
            <div className="mb-2 text-[11px] text-zinc-400">Không có dữ liệu giá.</div>
          )}
          <div className="mt-2 flex gap-2">
            <button
              onClick={applyPrice}
              className="rounded-md bg-yellow-500 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-600"
            >Áp dụng</button>
            <button
              onClick={clearPrice}
              className="rounded-md px-3 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-700"
            >Xóa</button>
          </div>
        </Section>

        {!!colors.length && (
          <Section title="Màu sắc">
            <div className="flex flex-wrap gap-2">
              {colors.map(({ value, count }) => {
                const active = selectedColors.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleMulti('color', selectedColors, value)}
                    className={`relative h-9 w-9 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-yellow-400 ${active ? 'border-yellow-500 ring-2 ring-yellow-300' : 'border-zinc-200 hover:border-zinc-400'}`}
                    style={{ backgroundColor: value.includes('#') ? value : value }}
                    aria-label={`Màu ${value}`}
                  >
                    <span className="pointer-events-none absolute -bottom-1 -right-1 rounded-full bg-white px-1 text-[10px] font-semibold text-zinc-600 shadow">{count}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {!!sizes.length && (
          <Section title="Kích cỡ">
            <div className="flex flex-wrap gap-2">
              {sizes.map(({ value, count }) => {
                const active = selectedSizes.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleMulti('size', selectedSizes, value)}
                    className={`relative rounded-md px-2 py-1 text-xs font-medium transition ${active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
                  >
                    {value}
                    <span className="ml-1 text-[10px] font-normal text-zinc-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
