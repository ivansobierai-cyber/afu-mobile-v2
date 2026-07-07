import { useCallback, useEffect, useState } from "react";
import type { CartItem } from "@/shared/marketplace";
import { clearCart, loadCart, saveCart } from "@/lib/marketplace-cart";

export function useMarketplaceCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadCart().then((loaded) => {
      setItems(loaded);
      setReady(true);
    });
  }, []);

  const persist = useCallback(async (next: CartItem[]) => {
    setItems(next);
    await saveCart(next);
  }, []);

  const addItem = useCallback(
    async (item: Omit<CartItem, "quantidade"> & { quantidade?: number }) => {
      const qtd = item.quantidade ?? 1;
      const existing = items.find((i) => i.produtoId === item.produtoId);
      if (existing) {
        await persist(
          items.map((i) =>
            i.produtoId === item.produtoId ? { ...i, quantidade: i.quantidade + qtd } : i,
          ),
        );
        return;
      }
      await persist([...items, { ...item, quantidade: qtd }]);
    },
    [items, persist],
  );

  const updateQuantity = useCallback(
    async (produtoId: number, quantidade: number) => {
      if (quantidade <= 0) {
        await persist(items.filter((i) => i.produtoId !== produtoId));
        return;
      }
      await persist(items.map((i) => (i.produtoId === produtoId ? { ...i, quantidade } : i)));
    },
    [items, persist],
  );

  const removeItem = useCallback(
    async (produtoId: number) => {
      await persist(items.filter((i) => i.produtoId !== produtoId));
    },
    [items, persist],
  );

  const emptyCart = useCallback(async () => {
    setItems([]);
    await clearCart();
  }, []);

  const total = items.reduce((sum, i) => sum + i.preco * i.quantidade, 0);
  const count = items.reduce((sum, i) => sum + i.quantidade, 0);

  return { items, ready, addItem, updateQuantity, removeItem, emptyCart, total, count };
}
