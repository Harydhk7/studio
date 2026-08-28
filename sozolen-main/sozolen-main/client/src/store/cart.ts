import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  itemKey: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  variantId?: string | null;
  variantName?: string | null;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedOther?: string | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "itemKey" | "quantity">) => void;
  removeItem: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

const normalizeColor = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeSize = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeOther = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const getCartItemKey = (
  productId: number,
  variantId?: string | null,
  selectedColor?: string | null,
  selectedSize?: string | null,
  selectedOther?: string | null
) => {
  const normalizedVariantId = variantId?.trim() || null;
  const normalizedColor = normalizeColor(selectedColor);
  const normalizedSize = normalizeSize(selectedSize);
  const normalizedOther = normalizeOther(selectedOther);
  const variantPart = normalizedVariantId ? normalizedVariantId.toLowerCase() : "default";
  const colorPart = normalizedColor ? normalizedColor.toLowerCase() : "default";
  const sizePart = normalizedSize ? normalizedSize.toLowerCase() : "default";
  const otherPart = normalizedOther ? normalizedOther.toLowerCase() : "default";
  return `${productId}::${variantPart}::${colorPart}::${sizePart}::${otherPart}`;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const variantId = item.variantId?.trim() || null;
          const variantName = item.variantName?.trim() || null;
          const selectedColor = normalizeColor(item.selectedColor);
          const selectedSize = normalizeSize(item.selectedSize);
          const selectedOther = normalizeOther(item.selectedOther);
          const itemKey = getCartItemKey(item.productId, variantId, selectedColor, selectedSize, selectedOther);
          const existing = state.items.find((i) => i.itemKey === itemKey);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.itemKey === itemKey ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                variantId,
                variantName,
                selectedColor,
                selectedSize,
                selectedOther,
                itemKey,
                quantity: 1,
              },
            ],
          };
        }),
      removeItem: (itemKey) =>
        set((state) => ({
          items: state.items.filter((i) => i.itemKey !== itemKey),
        })),
      updateQuantity: (itemKey, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.itemKey === itemKey ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: "cart-storage",
      version: 4,
      migrate: (persistedState: any) => {
        const items = Array.isArray(persistedState?.items) ? persistedState.items : [];
        return {
          ...persistedState,
          items: items.map((item: any) => {
            const variantId =
              typeof item?.variantId === "string" && item.variantId.trim().length > 0
                ? item.variantId.trim()
                : null;
            const variantName =
              typeof item?.variantName === "string" && item.variantName.trim().length > 0
                ? item.variantName.trim()
                : null;
            const selectedColor = normalizeColor(item?.selectedColor);
            const selectedSize = normalizeSize(item?.selectedSize);
            const selectedOther = normalizeOther(item?.selectedOther);
            return {
              ...item,
              variantId,
              variantName,
              selectedColor,
              selectedSize,
              selectedOther,
              itemKey:
                typeof item?.itemKey === "string" && item.itemKey.trim().length > 0
                  ? item.itemKey
                  : getCartItemKey(
                      Number(item?.productId ?? 0),
                      variantId,
                      selectedColor,
                      selectedSize,
                      selectedOther,
                    ),
            };
          }),
        };
      },
    }
  )
);
