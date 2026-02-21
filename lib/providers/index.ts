import type { IEsimProvider } from './types';
import { EsimAccessProvider } from './esim-access/client';

// Provider registry — add new providers here
const providerCache = new Map<string, IEsimProvider>();

function createProvider(name: string): IEsimProvider {
  switch (name) {
    case 'esim_access':
      return new EsimAccessProvider(process.env.ESIM_ACCESS_API_KEY!);
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

export function getProvider(name: string = 'esim_access'): IEsimProvider {
  if (!providerCache.has(name)) {
    providerCache.set(name, createProvider(name));
  }
  return providerCache.get(name)!;
}

export type { IEsimProvider };
export type { CanonicalPackage, CanonicalOrderResult, CanonicalEsimStatus, CanonicalBalance } from './types';
