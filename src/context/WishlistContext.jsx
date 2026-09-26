import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = "/api";

const WishlistContext = createContext({
  items: [],          // [{ product_id, variant_id }]
  isWishlisted: () => false,
  refresh: () => {},
  setLocal: () => {},
});

export const WishlistProvider = ({ children }) => {
  const { loggedIn } = useAuth();
  const [items, setItems] = useState([]); // array of { product_id, variant_id }
  const token = localStorage.getItem("auth_token");

  const refresh = useCallback(async () => {
    if (!loggedIn) {
      setItems([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/wishlist`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        const payload = data.data || data;
        const raw = payload.items ?? payload.wishlist_items ?? [];
        // Normalize into {product_id, variant_id} pairs
        setItems(
          raw.map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id ?? 0,
          })),
        );
      }
    } catch {
      /* ignore */
    }
  }, [loggedIn, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isWishlisted = (productId, variantId = 0) =>
    items.some(
      (i) =>
        i.product_id === productId &&
        (i.variant_id || 0) === (variantId || 0),
    );

  const setLocal = (productId, variantId, active) => {
    setItems((prev) => {
      const filtered = prev.filter(
        (i) =>
          !(
            i.product_id === productId &&
            (i.variant_id || 0) === (variantId || 0)
          ),
      );
      return active
        ? [...filtered, { product_id: productId, variant_id: variantId }]
        : filtered;
    });
  };

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, refresh, setLocal }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);