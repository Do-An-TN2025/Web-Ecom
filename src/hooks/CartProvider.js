import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import CartService from "../services/CartService";

const LOCAL_CART_KEY = "app_cart_v1";

// <-- thêm default context để tránh null khi component chưa được wrap
const DEFAULT_CART_CTX = {
  items: [],
  totalItems: 0,
  addItem: () => {},
  updateItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  setItems: () => {},
};


const CartContext = createContext(DEFAULT_CART_CTX);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // đọc local sync ngay khi mount — tránh UI trắng khi đang chờ async
    try {
      const raw = localStorage.getItem(LOCAL_CART_KEY);
      const localCart = raw ? JSON.parse(raw) : [];
      if (Array.isArray(localCart) && localCart.length) {
        setItems(localCart);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }

    const init = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const user = localStorage.getItem("user");
        const isAuth = !!token && !!user;

        // nếu đã auth và local có dữ liệu -> thử merge trước khi fetch server cart
        if (isAuth) {
          const localRaw = localStorage.getItem(LOCAL_CART_KEY);
          const localCart = localRaw ? JSON.parse(localRaw) : [];
          if (localCart && localCart.length) {
            try {
              const mergeRes = await CartService.mergeLocalToServer();
              // nếu merge thất bại thì không ghi đè UI (giữ local đã set ở trên)
              if (!mergeRes.ok || !mergeRes.merged) {
                return;
              }
              // nếu merged true -> tiếp tục fetch server cart
            } catch (e) {
              // merge lỗi -> giữ local
              return;
            }
          }

          // fetch server cart và set lại state nếu có dữ liệu server
          try {
            const res = await CartService.getCart();
            if (res && Array.isArray(res.items)) setItems(res.items);
            else if (Array.isArray(res)) setItems(res);
            // else giữ local (không overwrite với undefined/empty unexpected)
          } catch (e) {
            // lỗi fetch -> giữ local
          }
        }
        // nếu không auth: đã set local ở trên, không cần gọi server
      } catch (err) {
        // ignore, đã có fallback sync
      }
    };

    init();

    // sync across tabs
    const onStorage = (e) => {
      if (e.key === LOCAL_CART_KEY) {
        try {
          setItems(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          setItems([]);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // persist items -> localStorage when not auth
  useEffect(() => {
    try {
      const token = localStorage.getItem("auth_token");
      const user = localStorage.getItem("user");
      const isAuth = !!token && !!user;
      if (!isAuth) {
        localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items || []));
      }
    } catch {}
  }, [items]);

  const addItem = useCallback((item) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.key === item.key);
      let next;
      if (idx === -1) next = [...prev, item];
      else {    
        const clone = [...prev];
        clone[idx] = { ...clone[idx], qty: (clone[idx].qty || 0) + (item.qty || 0), ...item };
        next = clone;
      }
      return next;
    });
  }, []);

  const updateItem = useCallback((keyOrId, patch) => {
    setItems(prev => prev.map(i => (i.key === keyOrId || i._id === keyOrId ? { ...i, ...patch } : i)));
  }, []);

  const removeItem = useCallback((keyOrId) => {
    setItems(prev => prev.filter(i => i.key !== keyOrId && i._id !== keyOrId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{
      items,
      totalItems: items.reduce((s, it) => s + (it.qty || 0), 0),
      addItem,
      updateItem,
      removeItem,
      clearCart,
      setItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);