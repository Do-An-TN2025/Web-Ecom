import React from 'react';

export default function ActiveFiltersChips({ filters, onClearAll, onClear, removeFromMulti }) {
  const chips = [];
  if (filters.minPrice || filters.maxPrice) {
    chips.push({ key: 'price', label: `${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}` });
  }
  if (filters.color) {
    filters.color.split(',').filter(Boolean).forEach(c => chips.push({ key: 'color', value: c, label: `Màu: ${c}` }));
  }
  if (filters.size) {
    filters.size.split(',').filter(Boolean).forEach(s => chips.push({ key: 'size', value: s, label: `Size: ${s}` }));
  }

  if (!chips.length) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map(chip => (
        <button
          key={chip.label + (chip.value || '')}
          onClick={() => {
            if (chip.key === 'price') {
              onClear('minPrice');
              onClear('maxPrice');
              return;
            }
            if ((chip.key === 'color' || chip.key === 'size') && chip.value) {
              removeFromMulti?.(chip.key, chip.value);
              return;
            }
            onClear(chip.key);
          }}
          className="group flex items-center gap-1 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur transition hover:border-yellow-400 hover:bg-white hover:text-zinc-800"
        >
          {chip.label}
          <span className="rounded-full bg-zinc-100 px-1 text-[10px] text-zinc-400 transition group-hover:bg-yellow-500 group-hover:text-white">✕</span>
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="rounded-full px-3 py-1 text-xs font-medium text-zinc-500 transition hover:text-zinc-800 hover:underline"
      >Xóa hết</button>
    </div>
  );
}
