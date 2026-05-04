import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { wishlistIds as initialWishlistIds } from "@/data/mockData";

type WishlistContextValue = {
  wishlist: string[];
  isWishlisted: (id: string) => boolean;
  toggle: (id: string) => boolean; // returns new state (true = added)
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>(initialWishlistIds);

  const toggle = useCallback((id: string) => {
    let added = false;
    setWishlist((prev) => {
      if (prev.includes(id)) {
        added = false;
        return prev.filter((x) => x !== id);
      }
      added = true;
      return [...prev, id];
    });
    return added;
  }, []);

  const isWishlisted = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, isWishlisted, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}