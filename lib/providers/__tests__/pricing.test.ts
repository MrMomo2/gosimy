import { describe, it, expect } from 'vitest';

function calcRetailPriceCents(costUsd: number): number {
  let multiplier: number;
  if (costUsd < 10) multiplier = 2.0;
  else if (costUsd < 20) multiplier = 1.75;
  else multiplier = 1.5;
  const rawCents = costUsd * multiplier * 100;
  const nextDollarCents = Math.ceil(rawCents / 100) * 100;
  return nextDollarCents - 1;
}

describe('Pricing Logic', () => {
  it('applies 100% markup with charm pricing for items under $10', () => {
    expect(calcRetailPriceCents(5)).toBe(999);
    expect(calcRetailPriceCents(1.80)).toBe(399);
    expect(calcRetailPriceCents(9.99)).toBe(1999);
  });

  it('applies 75% markup with charm pricing for items $10-$20', () => {
    expect(calcRetailPriceCents(10)).toBe(1799);
    expect(calcRetailPriceCents(15)).toBe(2699);
    expect(calcRetailPriceCents(19.99)).toBe(3499);
  });

  it('applies 50% markup with charm pricing for items over $20', () => {
    expect(calcRetailPriceCents(20)).toBe(2999);
    expect(calcRetailPriceCents(25)).toBe(3799);
    expect(calcRetailPriceCents(100)).toBe(14999);
  });

  it('always ends in .99 (charm pricing)', () => {
    expect(calcRetailPriceCents(1.11) % 100).toBe(99);
    expect(calcRetailPriceCents(5.55) % 100).toBe(99);
    expect(calcRetailPriceCents(15.55) % 100).toBe(99);
    expect(calcRetailPriceCents(50) % 100).toBe(99);
  });

  it('rounds up to next dollar before charm pricing', () => {
    expect(calcRetailPriceCents(3.60)).toBe(799);
    expect(calcRetailPriceCents(4.99)).toBe(999);
  });
});
