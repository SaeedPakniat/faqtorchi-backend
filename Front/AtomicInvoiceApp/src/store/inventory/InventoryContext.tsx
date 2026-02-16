import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadInventoryState, saveInventoryState } from "./inventoryStorage";
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  InventoryRecord,
  InventoryState,
  Product,
  ProductVariant,
  Warehouse,
} from "./models";

type InventoryContextValue = {
  loading: boolean;
  state: InventoryState;

  // Warehouses
  addWarehouse: (name: string) => void;
  renameWarehouse: (id: string, name: string) => void;
  removeWarehouse: (id: string) => void;

  // Products
  addProduct: (name: string) => void;
  renameProduct: (id: string, name: string) => void;
  removeProduct: (id: string) => void;

  // Variants
  addVariant: (productId: string, variant: Omit<ProductVariant, "id" | "productId" | "createdAt">) => void;
  updateVariant: (variantId: string, patch: Partial<Pick<ProductVariant, "attributes" | "priceToman">>) => void;
  removeVariant: (variantId: string) => void;

  // Inventory
  setInventoryQty: (warehouseId: string, variantId: string, qty: number) => void;
  adjustInventoryQty: (warehouseId: string, variantId: string, delta: number) => void;

  // Settings
  setLowStockThreshold: (n: number) => void;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<InventoryState>({
    warehouses: [],
    products: [],
    variants: [],
    inventory: [],
    lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
  });

  useEffect(() => {
    (async () => {
      const loaded = await loadInventoryState();
      setState(loaded);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    saveInventoryState(state);
  }, [state, loading]);

  const api = useMemo<InventoryContextValue>(() => {
    const now = () => new Date().toISOString();

    const addWarehouse = (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const wh: Warehouse = { id: uid("wh"), name: trimmed, createdAt: now() };
      setState((s) => ({ ...s, warehouses: [wh, ...s.warehouses] }));
    };

    const renameWarehouse = (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setState((s) => ({
        ...s,
        warehouses: s.warehouses.map((w) => (w.id === id ? { ...w, name: trimmed } : w)),
      }));
    };

    const removeWarehouse = (id: string) => {
      setState((s) => ({
        ...s,
        warehouses: s.warehouses.filter((w) => w.id !== id),
        inventory: s.inventory.filter((r) => r.warehouseId !== id),
      }));
    };

    const addProduct = (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const p: Product = { id: uid("p"), name: trimmed, createdAt: now() };
      setState((s) => ({ ...s, products: [p, ...s.products] }));
    };

    const renameProduct = (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setState((s) => ({
        ...s,
        products: s.products.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
      }));
    };

    const removeProduct = (id: string) => {
      setState((s) => {
        const variantIds = s.variants.filter((v) => v.productId === id).map((v) => v.id);
        return {
          ...s,
          products: s.products.filter((p) => p.id !== id),
          variants: s.variants.filter((v) => v.productId !== id),
          inventory: s.inventory.filter((r) => !variantIds.includes(r.variantId)),
        };
      });
    };

    const addVariant = (
      productId: string,
      variant: Omit<ProductVariant, "id" | "productId" | "createdAt">
    ) => {
      setState((s) => {
        const v: ProductVariant = {
          id: uid("v"),
          productId,
          attributes: variant.attributes ?? {},
          priceToman: Number.isFinite(variant.priceToman) ? Math.max(0, variant.priceToman) : 0,
          createdAt: now(),
        };
        return { ...s, variants: [v, ...s.variants] };
      });
    };

    const updateVariant = (variantId: string, patch: Partial<Pick<ProductVariant, "attributes" | "priceToman">>) => {
      setState((s) => ({
        ...s,
        variants: s.variants.map((v) =>
          v.id === variantId
            ? {
                ...v,
                attributes: patch.attributes ?? v.attributes,
                priceToman:
                  typeof patch.priceToman === "number" && Number.isFinite(patch.priceToman)
                    ? Math.max(0, patch.priceToman)
                    : v.priceToman,
              }
            : v
        ),
      }));
    };

    const removeVariant = (variantId: string) => {
      setState((s) => ({
        ...s,
        variants: s.variants.filter((v) => v.id !== variantId),
        inventory: s.inventory.filter((r) => r.variantId !== variantId),
      }));
    };

    const upsertRecord = (records: InventoryRecord[], warehouseId: string, variantId: string, qty: number) => {
      const idx = records.findIndex((r) => r.warehouseId === warehouseId && r.variantId === variantId);
      const rec: InventoryRecord = { warehouseId, variantId, qty: Math.max(0, qty), updatedAt: now() };
      if (idx === -1) return [rec, ...records];
      const copy = records.slice();
      copy[idx] = rec;
      return copy;
    };

    const setInventoryQty = (warehouseId: string, variantId: string, qty: number) => {
      setState((s) => ({ ...s, inventory: upsertRecord(s.inventory, warehouseId, variantId, qty) }));
    };

    const adjustInventoryQty = (warehouseId: string, variantId: string, delta: number) => {
      setState((s) => {
        const cur = s.inventory.find((r) => r.warehouseId === warehouseId && r.variantId === variantId)?.qty ?? 0;
        return { ...s, inventory: upsertRecord(s.inventory, warehouseId, variantId, cur + delta) };
      });
    };

    const setLowStockThreshold = (n: number) => {
      const v = Number.isFinite(n) ? Math.max(1, Math.floor(n)) : DEFAULT_LOW_STOCK_THRESHOLD;
      setState((s) => ({ ...s, lowStockThreshold: v }));
    };

    return {
      loading,
      state,
      addWarehouse,
      renameWarehouse,
      removeWarehouse,
      addProduct,
      renameProduct,
      removeProduct,
      addVariant,
      updateVariant,
      removeVariant,
      setInventoryQty,
      adjustInventoryQty,
      setLowStockThreshold,
    };
  }, [loading, state]);

  return <InventoryContext.Provider value={api}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
