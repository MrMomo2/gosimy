import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { trackEcommerce } from '@/lib/analytics/ga4';

const CART_TTL_MS = 24 * 60 * 60 * 1000;

export interface CartItem {
  packageCode: string;
  provider: string;
  name: string;
  countryCode: string;
  countryName: string;
  retailPriceCents: number;
  volumeBytes: string;
  durationDays: number;
  quantity: number;
  periodNum?: number;
  isDaily?: boolean;
}

interface CartState {
  items: CartItem[];
  createdAt: number | null;
  addItem: (item: Omit<CartItem, 'quantity'> & { periodNum?: number }) => void;
  removeItem: (packageCode: string, periodNum?: number) => void;
  updateQuantity: (packageCode: string, quantity: number, periodNum?: number) => void;
  clearCart: () => void;
  getTotalCents: () => number;
  getItemCount: () => number;
  isExpired: () => boolean;
}

function isCartExpired(createdAt: number | null): boolean {
  if (!createdAt) return false;
  return Date.now() - createdAt > CART_TTL_MS;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      createdAt: null,

      addItem: (item) => {
        const isDaily = item.isDaily ?? false;
        const periodNum = item.periodNum ?? 1;
        
        const pricePerDay = item.retailPriceCents / (item.durationDays || 1);
        const finalPriceCents = isDaily 
          ? Math.round(pricePerDay * periodNum)
          : item.retailPriceCents;

        trackEcommerce({
          type: 'add_to_cart',
          item: {
            itemId: item.packageCode,
            itemName: item.name,
            price: finalPriceCents / 100,
            quantity: 1,
            itemCategory: item.countryName,
          },
        });

        set((state) => {
          if (isCartExpired(state.createdAt)) {
            return {
              items: [{ ...item, quantity: 1, retailPriceCents: finalPriceCents }],
              createdAt: Date.now(),
            };
          }

          const existing = state.items.find(
            (i) => i.packageCode === item.packageCode && i.periodNum === periodNum
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.packageCode === item.packageCode && i.periodNum === periodNum
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1, retailPriceCents: finalPriceCents }],
            createdAt: state.createdAt ?? Date.now(),
          };
        });
      },

      removeItem: (packageCode, periodNum) => {
        const item = get().items.find((i) => i.packageCode === packageCode && i.periodNum === periodNum);
        if (item) {
          trackEcommerce({
            type: 'remove_from_cart',
            item: {
              itemId: item.packageCode,
              itemName: item.name,
              price: item.retailPriceCents / 100,
              quantity: item.quantity,
            },
          });
        }
        set((state) => ({
          items: state.items.filter((i) => !(i.packageCode === packageCode && i.periodNum === periodNum)),
        }));
      },

      updateQuantity: (packageCode, quantity, periodNum) => {
        if (quantity <= 0) {
          get().removeItem(packageCode, periodNum);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.packageCode === packageCode && i.periodNum === periodNum ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], createdAt: null }),

      getTotalCents: () => {
        if (get().isExpired()) return 0;
        return get().items.reduce(
          (sum, item) => sum + item.retailPriceCents * item.quantity,
          0
        );
      },

      getItemCount: () => {
        if (get().isExpired()) return 0;
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      isExpired: () => {
        const state = get();
        return isCartExpired(state.createdAt);
      },
    }),
    {
      name: 'gosimy-cart',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && isCartExpired(state.createdAt)) {
          state.items = [];
          state.createdAt = null;
        }
      },
    }
  )
);
