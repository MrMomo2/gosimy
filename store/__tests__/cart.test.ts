import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/store/cart';
import { act } from '@testing-library/react';

describe('Cart Store', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  const sampleItem = {
    packageCode: 'TEST-PKG',
    provider: 'esim_access',
    name: 'Test Package',
    countryCode: 'US',
    countryName: 'United States',
    retailPriceCents: 1000,
    volumeBytes: '1073741824',
    durationDays: 30,
  };

  it('starts with empty cart', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.getItemCount()).toBe(0);
    expect(state.getTotalCents()).toBe(0);
  });

  it('adds item to cart', () => {
    act(() => {
      useCartStore.getState().addItem(sampleItem);
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].packageCode).toBe('TEST-PKG');
    expect(state.items[0].quantity).toBe(1);
    expect(state.getItemCount()).toBe(1);
  });

  it('increments quantity for existing item', () => {
    act(() => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().addItem(sampleItem);
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.getItemCount()).toBe(2);
  });

  it('calculates total correctly', () => {
    act(() => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().addItem(sampleItem);
    });

    expect(useCartStore.getState().getTotalCents()).toBe(2000);
  });

  it('removes item from cart', () => {
    act(() => {
      useCartStore.getState().addItem(sampleItem);
    });

    act(() => {
      useCartStore.getState().removeItem('TEST-PKG');
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('updates quantity', () => {
    act(() => {
      useCartStore.getState().addItem(sampleItem);
    });

    act(() => {
      useCartStore.getState().updateQuantity('TEST-PKG', 5);
    });

    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('removes item when quantity set to 0', () => {
    act(() => {
      useCartStore.getState().addItem(sampleItem);
    });

    act(() => {
      useCartStore.getState().updateQuantity('TEST-PKG', 0);
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('clears cart', () => {
    act(() => {
      useCartStore.getState().addItem(sampleItem);
      useCartStore.getState().addItem({ ...sampleItem, packageCode: 'TEST-PKG-2' });
    });

    act(() => {
      useCartStore.getState().clearCart();
    });

    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
