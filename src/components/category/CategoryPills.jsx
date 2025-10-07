import React from 'react';

/**
 * CategoryPills
 * Renders sibling/child categories as horizontal scrollable pills under breadcrumb.
 * Props:
 *  - category: current category object { slug, name, children? }
 *  - currentSlug: slug string from URL
 *  - onNavigate: function(slug)
 */
export default function CategoryPills({ category, currentSlug, onNavigate }) {
  if (!category) return null;

  // Prefer children; if none, just render current as single pill
  const items = (category.children && category.children.length ? category.children : [category])
    .map(c => ({ slug: c.slug || c.path || c.id || c.name, label: c.name || c.title || c.slug }));

  if (!items.length) return null;

  return (
    <div className="mb-4 -mx-4 overflow-x-auto pb-1 pl-4 pr-4">
      <div className="flex min-w-max gap-2">
        {items.map(item => {
          const active = item.slug === currentSlug;
          return (
            <button
              key={item.slug}
              onClick={() => !active && onNavigate?.(item.slug)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? 'border-yellow-500 bg-yellow-500 text-white shadow-sm' : 'border-zinc-200 bg-white text-zinc-600 hover:border-yellow-400 hover:text-zinc-800'}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
