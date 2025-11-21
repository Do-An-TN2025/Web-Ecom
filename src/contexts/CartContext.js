import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import CartService from "../services/CartService";

const STORAGE_KEY = "app_cart_v1";

const DEFAULT_CTX = {
  items: [],
  addItem: () => Promise.resolve(),
  updateQty: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
  clearCart: () => Promise.resolve(),
  totalItems: 0,
  totalAmount: 0,
  setItems: () => {},
};

const CartCtx = createContext(DEFAULT_CTX);

/* -------------------------
   local storage helpers
   ------------------------- */
function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeLocal(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items || []));
  } catch (e) {
    console.error("[CartContext] writeLocal error", e);
  }
}
function clearLocal() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("[CartContext] clearLocal error", e);
  }
}

/* -------------------------
   normalize + dedupe utils
   ------------------------- */
function normalizeItem(raw = {}) {
  const qty = Number(raw.qty ?? raw.quantity ?? 0) || 0;
  const productId = raw.productId ?? (raw.product && (raw.product._id || raw.product.id)) ?? null;
  const variantId = raw.variantId ?? (raw.variant && (raw.variant._id || raw.variant.id)) ?? null;
  const size = raw.size ?? (raw.sizeInfo && (raw.sizeInfo.name || raw.sizeInfo.size)) ?? "";
  const key =
    raw.key ||
    (productId ? `${productId}-${variantId ?? "v"}-${String(size)}` : raw.key || `tmp-${Math.random().toString(36).slice(2, 9)}`);

  return {
    ...raw,
    qty,
    quantity: qty,
    productId,
    variantId,
    size,
    key,
  };
}

function dedupeItems(list = [], options = { sum: true }) {
  const { sum } = options || { sum: true };
  const map = new Map();
  for (const r of list) {
    const it = normalizeItem(r);
    const k = it.key || `${it.productId}-${it.variantId}-${it.size}`;
    if (map.has(k)) {
      const prev = map.get(k);
      if (sum) {
        const total = Number(prev.qty || 0) + Number(it.qty || 0);
        map.set(k, { ...prev, ...it, qty: total, quantity: total });
      } else {
        // replace existing with latest (server authoritative)
        map.set(k, { ...prev, ...it });
      }
    } else {
      map.set(k, it);
    }
  }
  return Array.from(map.values());
}

/* -------------------------
   Provider
   ------------------------- */
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const didMountRef = useRef(false);

  // load local synchronously on first render to avoid blank UI
  useEffect(() => {
    try {
      const local = readLocal();
      if (Array.isArray(local) && local.length) setItems(dedupeItems(local));
    } catch (e) {
      console.error("[CartContext] initial load error", e);
    } finally {
      // mark didMount on next tick to avoid persisting initial read
      Promise.resolve().then(() => {
        didMountRef.current = true;
      });
    }
  }, []);

  // persist local cart for guest users only
  useEffect(() => {
    if (!didMountRef.current) return;
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("user");
    if (!token || !user) {
      writeLocal(items);
    }
  }, [items]);

  // sync on auth: merge local -> server then load server cart
  useEffect(() => {
    let mounted = true;
    const syncAuthCart = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const user = localStorage.getItem("user");
        if (!token || !user) return;

        // merge local into server, CartService should handle the merge
        try {
          const mergeRes = await CartService.mergeLocalToServer();
          if (mergeRes && mergeRes.server) {
            const srv = mergeRes.server;
            if (srv && Array.isArray(srv.items)) {
              if (mounted) setItems(dedupeItems(srv.items));
              clearLocal();
              return;
            }
            if (Array.isArray(srv)) {
              if (mounted) setItems(dedupeItems(srv));
              clearLocal();
              return;
            }
          }
        } catch (e) {
          // ignore merge failure and continue to fetch
          console.debug("[CartContext] mergeLocalToServer failed", e);
        }

        // fallback: fetch server cart
        const server = await CartService.getCart();
        if (!mounted) return;
        if (server && Array.isArray(server.items)) setItems(dedupeItems(server.items));
        else if (Array.isArray(server)) setItems(dedupeItems(server));
      } catch (err) {
        console.warn("[CartContext] syncAuthCart failed", err);
      }
    };

    syncAuthCart();

    const onAuthLogin = () => syncAuthCart();
    const onAuthLogout = () => {
      try {
        const local = readLocal();
        if (Array.isArray(local) && local.length) setItems(dedupeItems(local));
        else {
          setItems([]);
          clearLocal();
        }
      } catch (e) {
        console.error("[CartContext] onAuthLogout error", e);
        setItems([]);
      }
    };

    const onStorage = (e) => {
      try {
        if (!e) return;
        if (e.key === "auth_token" && !e.newValue) {
          onAuthLogout();
          return;
        }
        if (e.key === "user" && !e.newValue) {
          onAuthLogout();
          return;
        }
        if (e.key === STORAGE_KEY) {
          const local = readLocal();
          setItems(Array.isArray(local) ? dedupeItems(local) : []);
        }
      } catch (err) {
        console.error("[CartContext] onStorage error", err);
      }
    };

    window.addEventListener("auth:login", onAuthLogin);
    window.addEventListener("auth:logout", onAuthLogout);
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("auth:login", onAuthLogin);
      window.removeEventListener("auth:logout", onAuthLogout);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  /* -------------------------
     addItem: optimistic + dedupe + server sync
     ------------------------- */
  const addItem = useCallback((payload, options = {}) => {
    const { throwOnError = false } = options || {};
    const safe = { qty: 1, ...payload };
    safe.key =
      safe.key ||
      (safe.productId ? `${safe.productId}-${safe.variantId ?? "v"}-${String(safe.size ?? "")}` : safe.key);

    const qtyToAdd = Number(safe.qty ?? safe.quantity ?? 1) || 1;
    let snapshotAfterOptimistic = [];
    let prevSnapshot = null;
    let aborted = false;

    // optimistic update (functional to avoid stale)
    setItems((prev) => {
      try {
        // capture previous server-authoritative snapshot (non-summed) for potential revert
        prevSnapshot = dedupeItems(prev.map(normalizeItem), { sum: false });
      } catch (e) {
        prevSnapshot = null;
      }
      try {
        console.debug("[CartContext.addItem] before optimistic, prev:", JSON.parse(JSON.stringify(prev)), "payload:", JSON.parse(JSON.stringify(safe)));
      } catch (e) {
        console.debug("[CartContext.addItem] before optimistic (could not stringify)");
      }
      const normalizedPrev = prev.map(normalizeItem);
      const idx = normalizedPrev.findIndex(
        (it) =>
          (it.key && it.key === safe.key) ||
          (String(it.productId) === String(safe.productId) &&
            String(it.variantId ?? "") === String(safe.variantId ?? "") &&
            (it.size || "") === (safe.size || ""))
      );

      // determine available stock from payload or existing item if present
      const existing = idx > -1 ? normalizedPrev[idx] : null;
      const availableStock = Number(
        safe.stock ?? safe.variant?.stock ?? safe.product?.stock ?? existing?.stock ?? existing?.available ?? existing?.count ?? Infinity
      );

      const existingQty = Number(existing?.qty ?? 0);
      if (Number.isFinite(availableStock) && existingQty + qtyToAdd > availableStock) {
        // do not perform optimistic update -- abort and log
        const msg = `[CartContext.addItem] Requested qty ${existingQty + qtyToAdd} for ${safe.productId || safe.key} exceeds stock ${availableStock}`;
        console.error(msg);
        try {
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('cart:error', { detail: { message: 'Exceeds stock', code: 'EXCEEDS_STOCK', productId: safe.productId || safe.key, requested: existingQty + qtyToAdd, available: availableStock } }));
          }
          try {
            toast.warn('Số lượng yêu cầu vượt quá tồn kho', { toastId: 'exceeds-stock' });
          } catch (e) {
            console.error('[CartContext.addItem] toast.warn failed', e);
          }
        } catch (e) {
          console.error('[CartContext.addItem] dispatch cart:error failed', e);
        }
        aborted = true;
        return prev;
      }

      if (idx > -1) {
        const updatedQty = Number(existing.qty || 0) + qtyToAdd;
        normalizedPrev[idx] = { ...existing, ...safe, qty: updatedQty, quantity: updatedQty };
      } else {
        normalizedPrev.push(normalizeItem({ ...safe, qty: qtyToAdd, quantity: qtyToAdd }));
      }

      snapshotAfterOptimistic = dedupeItems(normalizedPrev, { sum: true });
      try {
        console.debug("[CartContext.addItem] after optimistic, snapshot:", JSON.parse(JSON.stringify(snapshotAfterOptimistic)));
      } catch (e) {}
      return snapshotAfterOptimistic;
    });

    // NOTE: do not write local here for guest users — CartService.addItem
    // handles local persistence for guests. Writing here + CartService
    // writing again causes duplicate increments (optimistic write +
    // service increment). So we only keep the optimistic state update
    // (setItems) and let CartService persist the final state.
    if (aborted) {
      // return an error shape or reject based on options
      const err = { message: "Exceeds stock" };
      if (throwOnError) return Promise.reject(err);
      return Promise.resolve({ ok: false, error: err });
    }

    // call server and reconcile
    return (async () => {
      try {
        const res = await CartService.addItem(safe);
        // server may return items array or full cart
        const serverItems =
          res && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : res && res.items ? res.items : null;

        if (serverItems && Array.isArray(serverItems)) {
          try {
            console.debug("[CartContext.addItem] server returned items:", JSON.parse(JSON.stringify(serverItems)));
          } catch (e) {}
          // normalize server items and dedupe — prefer server (don't sum duplicates)
          const srv = dedupeItems(serverItems, { sum: false });
          setItems(srv);
          clearLocal();
        }
        return res;
      } catch (err) {
        console.error("[CartContext] addItem error", err);
        // revert optimistic change so UI doesn't keep the increased qty when API failed
        try {
          if (prevSnapshot) setItems(prevSnapshot);
        } catch (e) {
          console.error('[CartContext.addItem] revert failed', e);
        }
        try {
          const serverMsg = (err && (err.message || (err.response && err.response.data && err.response.data.message))) || "";
          if (String(serverMsg).toLowerCase().includes('exceed')) {
            try {
              toast.warn('Số lượng yêu cầu vượt quá tồn kho', { toastId: 'exceeds-stock' });
            } catch (e) {
              console.error('[CartContext.addItem] toast.warn failed', e);
            }
          } else {
            const msg = serverMsg || "Không thể thêm vào giỏ hàng";
            try {
              toast.error(msg, { toastId: 'cart-add-error' });
            } catch (e) {
              console.error('[CartContext] toast show error', e);
            }
          }
        } catch (e) {
          console.error('[CartContext.addItem] message handling failed', e);
        }
        if (throwOnError) throw err;
        return { ok: false, error: err };
      }
    })();
  }, []);

  /* -------------------------
     updateQty: optimistic + server sync
     ------------------------- */
  const updateQty = useCallback((keyOrId, qty) => {
    const numericQty = Number(qty) || 0;
    // capture previous snapshot so we can revert if server rejects
    let prevSnapshot = null;
    // optimistic update
    setItems((prev) => {
      const normalizedPrev = prev.map(normalizeItem);
      // store a copy of previous state for potential revert
      prevSnapshot = dedupeItems(normalizedPrev, { sum: false });
      if (numericQty <= 0) {
        return normalizedPrev.filter((it) => !(it.key === keyOrId || String(it._id) === String(keyOrId)));
      }
      const mapped = normalizedPrev.map((it) =>
        it.key === keyOrId || String(it._id) === String(keyOrId) ? { ...it, qty: numericQty, quantity: numericQty } : it
      );
      return dedupeItems(mapped);
    });

    // persist immediate for guest
    try {
      const token = localStorage.getItem("auth_token");
      const user = localStorage.getItem("user");
      if (!token || !user) {
        const local = readLocal();
        const updated = (local || []).map(normalizeItem).map((it) =>
          it.key === keyOrId || String(it._id) === String(keyOrId) ? { ...it, qty: numericQty, quantity: numericQty } : it
        );
        writeLocal(dedupeItems(updated));
      }
    } catch (e) {
      console.error("[CartContext] updateQty persist error", e);
    }

    return (async () => {
      try {
        const res = await CartService.updateItem(keyOrId, { quantity: numericQty, qty: numericQty });
        if (res) {
          const serverItems = res && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : null;
          if (serverItems && Array.isArray(serverItems)) setItems(dedupeItems(serverItems, { sum: false }));
        }
        return res;
      } catch (err) {
        console.error("[CartContext] updateQty error", err.message  || err);
        // If the server explicitly says quantity exceeds stock, show a toast and
        // return a non-throwing error shape so callers don't get an uncaught rejection.
        try {
          const msg = err && (err.message || (err.response && err.response.data && err.response.data.message)) || "Không thể cập nhật số lượng";
          if (String(msg).toLowerCase().includes("exceeds stock") || String(msg).toLowerCase().includes("exceed")) {
            // revert optimistic change so UI shows original quantity
            try {
              if (prevSnapshot) setItems(prevSnapshot);
            } catch (e) {
              console.error('[CartContext.updateQty] revert failed', e);
            }
            try {
              toast.warn('Số lượng yêu cầu vượt quá tồn kho', { toastId: 'exceeds-stock' });
            } catch (e) {
              console.error('[CartContext.updateQty] toast failed', e);
            }
            return { ok: false, error: err };
          }
        } catch (e) {
          console.error('[CartContext.updateQty] message handling failed', e);
        }
        throw err;
      }
    })();
  }, []);

  /* -------------------------
     decrementItem: decrement by 1 (or remove if becomes 0)
     ------------------------- */
  const decrementItem = useCallback((keyOrId) => {
    // optimistic update
    setItems((prev) => {
      const normalizedPrev = prev.map(normalizeItem);
      const idx = normalizedPrev.findIndex(it => it.key === keyOrId || String(it._id) === String(keyOrId));
      if (idx === -1) return normalizedPrev;
      const currentQty = Number(normalizedPrev[idx].qty || normalizedPrev[idx].quantity || 0);
      if (currentQty > 1) {
        normalizedPrev[idx] = { ...normalizedPrev[idx], qty: currentQty - 1, quantity: currentQty - 1 };
        return dedupeItems(normalizedPrev);
      }
      // remove
      const filtered = normalizedPrev.filter((it, i) => i !== idx);
      return dedupeItems(filtered);
    });

    // persist immediate for guest users
    try {
      const token = localStorage.getItem("auth_token");
      const user = localStorage.getItem("user");
      if (!token || !user) {
        const local = readLocal();
        const updated = (local || []).map(normalizeItem).map(it =>
          (it.key === keyOrId || String(it._id) === String(keyOrId))
            ? { ...it, qty: Math.max(0, (Number(it.qty || it.quantity || 0) - 1)) }
            : it
        ).filter(it => Number(it.qty || it.quantity || 0) > 0);
        writeLocal(updated);
      }
    } catch (e) {
      console.error("[CartContext] decrementItem persist error", e);
    }

    return (async () => {
      try {
        const res = await CartService.decrementItem(keyOrId);
        if (res) {
          const serverItems = res && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : null;
          if (serverItems && Array.isArray(serverItems)) setItems(dedupeItems(serverItems, { sum: false }));
        }
        return res;
      } catch (err) {
        console.error('[CartContext] decrementItem error', err);
        throw err;
      }
    })();
  }, []);

  /* -------------------------
     removeItem
     ------------------------- */
  const removeItem = useCallback((keyOrId) => {
    setItems((prev) => prev.filter((it) => !(it.key === keyOrId || String(it._id) === String(keyOrId))));
    try {
      const token = localStorage.getItem("auth_token");
      const user = localStorage.getItem("user");
      if (!token || !user) {
        const local = readLocal();
        const updated = (local || []).filter((it) => {
          const nit = normalizeItem(it);
          return !(nit.key === keyOrId || String(nit._id) === String(keyOrId));
        });
        writeLocal(dedupeItems(updated));
      }
    } catch (e) {
      console.error("[CartContext] removeItem persist error", e);
    }

    return (async () => {
      try {
        const res = await CartService.removeItem(keyOrId);
        if (res) {
          const serverItems = res && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : null;
          if (serverItems && Array.isArray(serverItems)) setItems(dedupeItems(serverItems, { sum: false }));
        }
        return res;
      } catch (err) {
        console.error("[CartContext] removeItem error", err);
        throw err;
      }
    })();
  }, []);

  /* -------------------------
     clearCart
     ------------------------- */
  const clearCart = useCallback(() => {
    setItems([]);
    clearLocal();
    return (async () => {
      try {
        const res = await CartService.clearCart();
        if (res && res.items && Array.isArray(res.items)) setItems(dedupeItems(res.items));
        else if (res && Array.isArray(res)) setItems(dedupeItems(res));
        return res;
      } catch (err) {
        console.error("[CartContext] clearCart error", err);
        throw err;
      }
    })();
  }, []);

  const totalItems = useMemo(() => items.reduce((s, it) => s + (Number(it.qty || it.quantity || 0) || 0), 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, it) => s + ((Number(it.finalPrice ?? it.price ?? 0) || 0) * (Number(it.qty || it.quantity || 0) || 0)), 0), [items]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQty,
      decrementItem,
      removeItem,
      clearCart,
      totalItems,
      totalAmount,
      setItems,
    }),
    [items, addItem, updateQty, removeItem, clearCart, totalItems, totalAmount]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
};

export const useCart = () => useContext(CartCtx);