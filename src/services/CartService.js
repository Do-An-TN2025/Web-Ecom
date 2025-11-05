const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
const TOKEN_KEY = "auth_token";
const USER_KEY = "user";
const LOCAL_CART_KEY = "app_cart_v1";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function getUser() {
  try {
    const v = localStorage.getItem(USER_KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
function hasAuth() {
  // require both token and user to consider authenticated
  return !!getToken() && !!getUser();
}

async function apiFetch(path, opts = {}) {
  const headers = opts.headers || {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  headers["Content-Type"] = headers["Content-Type"] || "application/json";
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const err = new Error(res.statusText || "API error");
    err.status = res.status;
    err.body = txt;
    throw err;
  }
  return res.json().catch(() => null);
}

function readLocalCart() {
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeLocalCart(items) {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items || []));
  return items || [];
}
function clearLocalCart() {
  localStorage.removeItem(LOCAL_CART_KEY);
}

function mergeItemsList(baseList, incoming) {
  const map = new Map();
  (baseList || []).forEach(it => map.set(it.key, { ...it }));
  (incoming || []).forEach(it => {
    if (!map.has(it.key)) map.set(it.key, { ...it });
    else {
      const exist = map.get(it.key);
      exist.qty = (exist.qty || 0) + (it.qty || 0);
      map.set(it.key, exist);
    }
  });
  return Array.from(map.values());
}

const CartService = {
  // returns { items: [...] } shape for guest, server response for auth
  async getCart() {
    if (hasAuth()) {
      // authenticated -> fetch server cart
      return apiFetch("/cart", { method: "GET" });
    }
    // guest -> read local
    return { items: readLocalCart() };
  },

  // add item: for guest persist local only; for auth call server
  async addItem(item, isFromMerge = false) {
    try {
      if (hasAuth()) {
        // authenticated: call server add endpoint
        const endpoint = isFromMerge ? "/cart/merge" : "/cart/add";
        // server expects either single item body or merge format
        const body = isFromMerge ? { items: [item] } : item;
        const res = await apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(body),
        });
        return res;
      } else {
        // guest: local storage only, do NOT call server
          const existing = readLocalCart();
          console.debug("[CartService.addItem] guest before add, localCart:", JSON.parse(JSON.stringify(existing)), "incoming:", JSON.parse(JSON.stringify(item)));
        const existingIndex = existing.findIndex(
          i => i.productId === item.productId &&
               i.color === item.color &&
               i.size === item.size
        );

        if (existingIndex > -1) {
          existing[existingIndex].qty = (existing[existingIndex].qty || 0) + (item.qty || 1);
        } else {
          existing.push(item);
        }

  writeLocalCart(existing); 
  console.debug("[CartService.addItem] guest after write, localCart:", JSON.parse(JSON.stringify(existing)));
  return { items: existing };
      }
    } catch (error) {
      console.error("CartService addItem error:", error);
      throw error;
    }
  },

  async updateItem(itemIdOrKey, patch) {
    try {
      if (hasAuth()) {
        return apiFetch(`/cart/item/${encodeURIComponent(itemIdOrKey)}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
      }
      // guest -> update local
      const items = readLocalCart();
      const idx = items.findIndex(i => i.key === itemIdOrKey || i._id === itemIdOrKey);
      if (idx === -1) return { items };
      items[idx] = { ...items[idx], ...patch };
      writeLocalCart(items);
      return { items };
    } catch (err) {
      console.error("CartService updateItem error:", err);
      throw err;
    }
  },

  async removeItem(itemIdOrKey) {
    try {
      if (hasAuth()) {
        return apiFetch(`/cart/item/${encodeURIComponent(itemIdOrKey)}`, {
          method: "DELETE",
        });
      }
      const items = readLocalCart().filter(i => i.key !== itemIdOrKey && i._id !== itemIdOrKey);
      writeLocalCart(items);
      return { items };
    } catch (err) {
      console.error("CartService removeItem error:", err);
      throw err;
    }
  },

  async clearCart() {
    try {
      if (hasAuth()) {
        return apiFetch("/cart/clear", { method: "DELETE" });
      }
      clearLocalCart();
      return { items: [] };
    } catch (err) {
      console.error("CartService clearCart error:", err);
      throw err;
    }
  },

  // Merge local cart into server cart (call after login)
  // Only runs when authenticated; does not call server for guests.
  async mergeLocalToServer() {
    const local = readLocalCart();
    if (!local.length || !hasAuth()) return { ok: true, merged: false };

    try {
      // call merge
      const res = await apiFetch("/cart/merge", {
        method: "POST",
        body: JSON.stringify({ items: local }),
      });

      const merged =
        !!res &&
        ((Array.isArray(res.items) && res.items.length > 0) ||
          res.merged === true ||
          res.ok === true);

      if (merged) {
        // clear local only after successful merge
        clearLocalCart();
        // fetch the authoritative cart back from server
        const serverCart = await apiFetch("/cart", { method: "GET" });
        return { ok: true, merged: true, server: serverCart };
      }

      return { ok: true, merged: false, server: res };
    } catch (err) {
      console.error("CartService.mergeLocalToServer error:", err);
      return { ok: false, merged: false, error: err };
    }
  },

  // utility: read/write local cart helpers are available above
};

export default CartService;