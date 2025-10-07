import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";

const CartCtx = createContext(null);

const STORAGE_KEY = "app_cart_v1";

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
  }, []);

  // Lưu lại
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((payload) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (it) =>
          it.productId === payload.productId &&
          it.color === payload.color &&
            it.size === payload.size
      );
      if (idx > -1) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], qty: clone[idx].qty + payload.qty };
        return clone;
      }
      return [...prev, { ...payload }];
    });
  }, []);

  const updateQty = useCallback((key, qty) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, qty: Math.max(1, qty) } : it))
    );
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((sum, it) => sum + it.qty, 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items]
  );

  const value = {
    items,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    totalItems,
    totalAmount,
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
};

export const useCart = () => useContext(CCartCtx);

const CCartCtx = CartCtx;