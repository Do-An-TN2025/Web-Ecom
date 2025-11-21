// Normalize various image shapes into a usable URL string for <img src>
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

function asString(val) {
  if (!val && val !== 0) return null;
  if (typeof val === 'string') return val || null;
  if (typeof val === 'number') return String(val);
  if (val.url && typeof val.url === 'string') return val.url;
  if (val.path && typeof val.path === 'string') return val.path;
  if (val.src && typeof val.src === 'string') return val.src;
  return null;
}

export default function resolveImage(input) {
  if (!input) return '/placeholder.jpg';

  // If input is an array, resolve first usable entry
  if (Array.isArray(input)) {
    for (const v of input) {
      const s = asString(v);
      if (s) return normalizeUrl(s);
    }
    return '/placeholder.jpg';
  }

  const s = asString(input);
  if (!s) return '/placeholder.jpg';
  return normalizeUrl(s);
}

function normalizeUrl(s) {
  // already absolute
  if (s.startsWith('http://') || s.startsWith('https://')) return s;

  // data url
  if (s.startsWith('data:')) return s;

  // relative path — if API_BASE present, prefix it, otherwise return as-is
  if (API_BASE) {
    // ensure there's a single slash between base and path
    if (s.startsWith('/')) return `${API_BASE}${s}`;
    return `${API_BASE}/${s}`;
  }
  return s.startsWith('/') ? s : `/${s}`;
}
