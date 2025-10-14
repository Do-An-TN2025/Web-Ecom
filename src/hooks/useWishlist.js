import { createContext, useContext, useState, useCallback } from "react";
import { getWishlistService, addToWishlistService, removeFromWishlistService , applyTokenFromStorage } from "../services/AuthService";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  applyTokenFromStorage();
  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWishlistService();
      setWishlist(data?.wishlist || []);
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const add = async (productId) => {
    await addToWishlistService({ productId });
    await fetchWishlist();
  };

  const remove = async (productId) => {
    await removeFromWishlistService({ productId });
    await fetchWishlist();
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        count: wishlist.length,
        loading,
        refresh: fetchWishlist,
        add,
        remove,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);