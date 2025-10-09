import { useEffect, useState } from "react";
import { getWishlistService , applyTokenFromStorage } from "../services/AuthService";

export default function useWishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  applyTokenFromStorage();
  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const data = await getWishlistService();
      setWishlist(data?.wishlist || []);
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  return { wishlist, count: wishlist.length, loading, refresh: fetchWishlist };
}