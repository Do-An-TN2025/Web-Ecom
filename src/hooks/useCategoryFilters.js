import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * Centralized hook to read & update category listing filters via URLSearchParams.
 * Keeps backward compatibility with existing backend API (sortBy, sortOrder, minPrice, maxPrice, color, size, page, limit).
 */
export function useCategoryFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const limit = parseInt(searchParams.get('limit') || '8', 10) || 8;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const color = searchParams.get('color') || '';
    const size = searchParams.get('size') || '';

    return { page, limit, sortBy, sortOrder, minPrice, maxPrice, color, size };
  }, [searchParams]);

  const update = useCallback(
    (partial) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(partial).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          next.delete(key);
        } else {
          next.set(key, Array.isArray(value) ? value.join(',') : String(value));
        }
      });
      // Reset page on filter change if page not explicitly provided
      if (!('page' in partial)) {
        next.set('page', '1');
      }
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const clear = useCallback(
    (key) => {
      const next = new URLSearchParams(searchParams);
      next.delete(key);
      next.set('page', '1');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const reset = useCallback(() => {
    setSearchParams({ page: '1', limit: String(filters.limit), sortBy: 'createdAt', sortOrder: 'desc' });
  }, [setSearchParams, filters.limit]);

  const removeFromMulti = useCallback(
    (key, value) => {
      const raw = searchParams.get(key);
      if (!raw) return;
      const arr = raw.split(',').filter(Boolean).filter(v => v !== value);
      update({ [key]: arr.length ? arr.join(',') : null });
    },
    [searchParams, update]
  );

  return { filters, update, clear, reset, removeFromMulti, rawSearchParams: searchParams };
}

export default useCategoryFilters;
