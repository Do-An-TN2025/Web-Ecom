import React from 'react';
import { LayoutGrid, List, Filter } from 'lucide-react';

const SORT_OPTIONS = [
  { label: 'Mới nhất', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Giá tăng', sortBy: 'price', sortOrder: 'asc' },
  { label: 'Giá giảm', sortBy: 'price', sortOrder: 'desc' },
  { label: 'Ưu đãi', sortBy: 'onSale', sortOrder: 'desc' }
];

export default function SortBar({ filters, onSortChange, viewMode, onViewModeChange, onOpenFilters, filterCount = 0 }) {
  return (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map(opt => {
          const active = filters.sortBy === opt.sortBy && filters.sortOrder === opt.sortOrder;
          return (
            <button
              key={opt.label}
              onClick={() => onSortChange(opt.sortBy, opt.sortOrder)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active ? 'bg-yellow-500 text-white shadow-sm' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >{opt.label}</button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenFilters?.()}
          className="relative inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
        >
          <Filter size={14} />
          Lọc
          {filterCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-semibold text-white">
              {filterCount}
            </span>
          )}
        </button>
        <div className="flex overflow-hidden rounded-full border border-zinc-200">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${viewMode === 'grid' ? 'bg-yellow-500 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            aria-label="Chế độ lưới"
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${viewMode === 'list' ? 'bg-yellow-500 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            aria-label="Chế độ danh sách"
          >
            <List size={14} />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>
    </div>
  );
}
