// src/utils/translateService.js
import axios from 'axios';

const LOCAL_CACHE_KEY = 'translate_cache_v1';

function readCache() {
  try { return JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || '{}'); }
  catch { return {}; }
}
function writeCache(cache) {
  localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache));
}
function cacheKey(text, target) {
  return `${target}::${text.slice(0,200)}`; // short hash okay for demo
}

export async function translateTextFrontend(text, target = 'vi', options = {}) {
  if (!text) return '';
  const cache = readCache();
  const key = cacheKey(text, target);
  if (cache[key]) return cache[key];

  // 1) Try backend proxy if exists
  try {
    const res = await axios.post('/api/translate', { text, target }, { timeout: 8000 });
    if (res?.data?.translated) {
      cache[key] = res.data.translated;
      writeCache(cache);
      return res.data.translated;
    }
  } catch (err) {
    // ignore and fallback
  }

  // 2) Fallback to LibreTranslate public instance (may be rate limited/CORS)
  try {
    const resp = await axios.post('https://libretranslate.com/translate', {
      q: text,
      source: 'en',
      target,
      format: 'text'
    }, { headers: { 'accept': 'application/json', 'Content-Type': 'application/json' }, timeout: 10000 });
    const translated = resp.data?.translatedText || resp.data;
    if (translated) {
      cache[key] = translated;
      writeCache(cache);
      return translated;
    }
  } catch (err) {
    // fallback failure
  }

  // 3) If all fails, return original
  return text;
}

// Optional: call backend to persist translation (if backend endpoint exists)
export async function persistTranslationToBackend(model, id, field, translatedText, lang = 'vi') {
  try {
    await axios.post('/api/save-translation', { model, id, field, lang, text: translatedText });
    return true;
  } catch (err) {
    return false;
  }
}