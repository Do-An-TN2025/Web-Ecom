import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  const addItem = useCallback((payload) => {
    const safe = { qty: 1, ...payload };
    safe.key =
      safe.key ||
      (safe.productId ? `${safe.productId}-${safe.variantId ?? "v"}-${String(safe.size ?? "")}` : safe.key);

    const qtyToAdd = Number(safe.qty ?? safe.quantity ?? 1) || 1;
    let snapshotAfterOptimistic = [];

    // optimistic update (functional to avoid stale)
    setItems((prev) => {
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

      if (idx > -1) {
        const existing = normalizedPrev[idx];
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
        throw err;
      }
    })();
  }, []);

  /* -------------------------
     updateQty: optimistic + server sync
     ------------------------- */
  const updateQty = useCallback((keyOrId, qty) => {
    const numericQty = Number(qty) || 0;

    // optimistic update
    setItems((prev) => {
      const normalizedPrev = prev.map(normalizeItem);
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
        console.error("[CartContext] updateQty error", err);
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