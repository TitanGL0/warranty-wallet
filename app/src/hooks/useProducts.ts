import { useEffect, useState } from "react";

import { subscribeToProducts } from "../services/products";
import { useAuthStore } from "../store/authStore";
import type { Product } from "../types";

export function useProducts(): {
  products: Product[];
  isLoading: boolean;
  error: string | null;
} {
  const uid = useAuthStore((state) => state.user?.uid ?? null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setProducts([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToProducts(
      uid,
      (nextProducts) => {
        setProducts(nextProducts);
        setError(null);
        setIsLoading(false);
      },
      () => {
        setProducts([]);
        setError("error.product.loadFailed");
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  return { products, isLoading, error };
}
