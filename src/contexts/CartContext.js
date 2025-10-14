// ...existing code...
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

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const didMountRef = useRef(false);

  // load local synchronously on first render to avoid blank UI
  useEffect(() => {
    try {
      const local = readLocal();
      if (Array.isArray(local) && local.length) setItems(local);
    } catch (e) {
      console.error("[CartContext] initial load error", e);
    }
    Promise.resolve().then(() => {
      didMountRef.current = true;
    });
  }, []);

  // persist local cart whenever items change and user is not authenticated
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

        // merge local -> server (CartService will only perform when authenticated)
        const mergeRes = await CartService.mergeLocalToServer();
        if (mergeRes && mergeRes.merged && mergeRes.server) {
          if (!mounted) return;
          const srv = mergeRes.server;
          if (srv && Array.isArray(srv.items)) {
            setItems(srv.items);
            return;
          }
          if (Array.isArray(srv)) {
            setItems(srv);
            return;
          }
        }

        // fallback: fetch server cart
        const server = await CartService.getCart();
        if (!mounted) return;
        if (server && Array.isArray(server.items)) setItems(server.items);
        else if (Array.isArray(server)) setItems(server);
        else if (server && server.items == null && Array.isArray(server)) setItems(server);
      } catch (err) {
        console.warn("[CartContext] syncAuthCart failed", err);
      }
    };

    syncAuthCart();
    const onAuthLogin = () => syncAuthCart();

    // when user logs out -> switch to guest/local cart (or empty)
    const onAuthLogout = () => {
      try {
        const local = readLocal();
        if (Array.isArray(local) && local.length) {
          setItems(local);
        } else {
          // switch to empty guest cart on logout (change if you prefer keeping guest cart)
          setItems([]);
          clearLocal();
        }
      } catch (e) {
        console.error("[CartContext] onAuthLogout error", e);
        setItems([]);
      }
    };

    // storage event for cross-tab sync (auth_token/user removal and local cart changes)
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
          setItems(Array.isArray(local) ? local : []);
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

  // helpers: optimistic UI updates then delegate persistence to CartService
  const addItem = useCallback((payload) => {
    const safePayload = { qty: 1, ...payload };
    if (!safePayload.key) {
      safePayload.key = `${safePayload.productId || "p"}-${safePayload.variantId || safePayload.color || "v"}-${safePayload.size || "s"}`;
    }

    // optimistic update and immediate local persist for guests
    let newItems;
    setItems(prev => {
      const idx = prev.findIndex(it =>
        (it.key && it.key === safePayload.key) ||
        (it.productId === safePayload.productId && (it.variantId ? String(it.variantId) === String(safePayload.variantId) : true) && it.size === safePayload.size)
      );
      if (idx > -1) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], qty: (clone[idx].qty || 0) + (safePayload.qty || 0), ...safePayload };
        newItems = clone;
        return clone;
      }
      newItems = [...prev, { ...safePayload }];
      return newItems;
    });

    // if guest, persist immediately to localStorage to avoid race at login
    try {
      const token = localStorage.getItem("auth_token");
      const user = localStorage.getItem("user");
      if (!token || !user) {
        writeLocal(newItems || []);
      }
    } catch (e) {
      console.error("[CartContext] persist immediate error", e);
    }

    return (async () => {
      try {
        const res = await CartService.addItem(safePayload);

        // normalize server response to array of items
        const serverItems = res && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : (res && res.items ? res.items : null);

        if (serverItems && Array.isArray(serverItems)) {
          // merge server items with local optimistic newItems to preserve display fields if server omits them
          const merged = serverItems.map(si => {
            const localMatch = (newItems || []).find(li =>
              (li.key && si.key && li.key === si.key) ||
              (li.variantId && si.variantId && String(li.variantId) === String(si.variantId) && li.size === si.size)
            );

            const qty = si.qty ?? si.quantity ?? localMatch?.qty ?? localMatch?.quantity ?? 1;

            return {
              // prefer server for ids/prices, but keep local display fields if missing on server
              ...localMatch,
              ...si,
              qty,
              quantity: qty,
              image: si.image || localMatch?.image || (si.variant && (Array.isArray(si.variant.images) ? si.variant.images[0] : si.variant.images)) || (si.product && si.product.thumbnail) || "/placeholder.jpg",
              name: si.name || localMatch?.name || (si.product && (si.product.title || si.product.name)) || "",
              color: si.color || localMatch?.color || (si.variant && si.variant.color) || "",
              product: si.product || localMatch?.product || si.product || null,
              variant: si.variant || localMatch?.variant || si.variant || null
            };
          });

          setItems(merged)
          clearLocal();
        } else {
        }

        return res;
      } catch (err) {
        console.error("[CartContext] addItem error", err);
        throw err;
      }
    })();
  }, []);

  const updateQty = useCallback((keyOrId, qty) => {
    // optimistic update (qty <= 0 removes)
    if (qty <= 0) {
      setItems(prev => prev.filter(it => !(it.key === keyOrId || String(it._id) === String(keyOrId))));
    } else {
      setItems(prev => prev.map(it => (it.key === keyOrId || String(it._id) === String(keyOrId) ? { ...it, qty } : it)));
    }

    return (async () => {
      try {
        const res = await CartService.updateItem(keyOrId, { quantity: qty, qty });
        if (res) {
          if (res.items && Array.isArray(res.items)) setItems(res.items);
          else if (Array.isArray(res)) setItems(res);
        }
        return res;
      } catch (err) {
        console.error("[CartContext] updateQty error", err);
        throw err;
      }
    })();
  }, []);

  const removeItem = useCallback((keyOrId) => {
    setItems(prev => prev.filter(it => !(it.key === keyOrId || String(it._id) === String(keyOrId))));

    return (async () => {
      try {
        const res = await CartService.removeItem(keyOrId);
        if (res) {
          if (res.items && Array.isArray(res.items)) setItems(res.items);
          else if (Array.isArray(res)) setItems(res);
        }
        return res;
      } catch (err) {
        console.error("[CartContext] removeItem error", err);
        throw err;
      }
    })();
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    // clear local immediately for guest
    clearLocal();

    return (async () => {
      try {
        const res = await CartService.clearCart();
        if (res && res.items && Array.isArray(res.items)) setItems(res.items);
        else if (res && Array.isArray(res)) setItems(res);
        return res;
      } catch (err) {
        console.error("[CartContext] clearCart error", err);
        throw err;
      }
    })();
  }, []);

  const totalItems = useMemo(() => items.reduce((s, it) => s + (it.qty || it.quantity || 0), 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, it) => s + ((it.finalPrice ?? it.price ?? 0) * (it.qty || it.quantity || 0)), 0), [items]);

  const value = useMemo(() => ({
    items,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    totalItems,
    totalAmount,
    setItems
  }), [items, totalItems, totalAmount, addItem, updateQty, removeItem, clearCart]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
};

export const useCart = () => useContext(CartCtx);