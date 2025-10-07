import React from 'react';

export default function ProductGridSkeleton({ count = 8, viewMode = 'grid' }) {
  if (viewMode === 'list') {
    return (
      <ul className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="flex items-start gap-4 rounded-lg border border-zinc-100 p-4 shadow-sm">
            <div className="h-24 w-24 animate-pulse rounded-md bg-zinc-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-200" />
              <div className="h-5 w-20 animate-pulse rounded bg-zinc-300" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-zinc-100 p-3 shadow-sm">
          <div className="mb-3 aspect-[3/4] w-full animate-pulse rounded-md bg-zinc-200" />
          <div className="space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200" />
            <div className="h-5 w-16 animate-pulse rounded bg-zinc-300" />
          </div>
        </div>
      ))}
    </div>
  );
}
