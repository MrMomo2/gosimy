// ─── Canonical types (provider-agnostic) ─────────────────────────────────────

export interface CanonicalPackage {
  packageCode: string;
  provider: string;
  name: string;
  countryCode: string;      // location code (e.g. "US", "EU")
  countryName: string;
  region?: string;          // 'europe' | 'asia' | 'americas' | 'middleEast' | 'africa' | 'oceania' | 'global'
  priceUsd: number;         // Provider cost in USD (already converted)
  retailPriceCents: number; // Retail price in EUR cents (with margin)
  volumeBytes: bigint;      // Data volume in bytes
  durationDays: number;
  dataType: 1 | 2;          // 1=fixed-period, 2=daily
  isMultiCountry?: boolean; // true for regional/global packages
  networkList?: NetworkInfo[];
  isActive: boolean;
  isTopup?: boolean;
}

export interface NetworkInfo {
  locationName: string;
  operatorName: string;
  networkType?: string;
}

export interface CanonicalOrderResult {
  /** Provider's order number — used for polling (e.g. "B25012220580005") */
  providerOrderNo: string;
  /** Per-eSIM transaction number — used for topup/cancel */
  esimTranNo?: string;
  iccid?: string;
  qrCodeUrl?: string;
  activationCode?: string;
  smdpStatus?: string;
  status: 'pending' | 'processing' | 'released' | 'failed';
}

export interface CanonicalEsimStatus {
  esimTranNo: string;
  iccid: string;
  smdpStatus: string;
  esimStatus?: string;
  dataUsedBytes: bigint;
  dataTotalBytes: bigint;
  expiresAt?: Date;
  activationCode?: string;
  qrCodeUrl?: string;
}

export interface CanonicalBalance {
  amount: number;
  currency: string;
}

export interface CanonicalLocation {
  code: string;
  name: string;
  type: 1 | 2;  // 1=country, 2=region
  children?: Array<{ code: string; name: string }>;
}

// ─── Provider interface ───────────────────────────────────────────────────────

export interface IEsimProvider {
  readonly name: string;

  /** List available packages, optionally filtered by location code */
  listPackages(locationCode?: string): Promise<CanonicalPackage[]>;

  /** List supported locations (countries + regions) */
  listLocations?(): Promise<CanonicalLocation[]>;

  /**
   * Place a new eSIM order.
   * Returns immediately with an orderNo for polling — eSIM is NOT yet provisioned.
   */
  placeOrder(packageCode: string, quantity: number, priceUsd: number): Promise<CanonicalOrderResult>;

  /**
   * Query provisioning status by orderNo OR iccid.
   * Returns the FIRST eSIM in the result set (use for single-quantity orders).
   */
  queryEsim(identifier: string): Promise<CanonicalEsimStatus>;

  /** Query live data usage for a list of esimTranNos */
  queryUsage?(esimTranNos: string[]): Promise<Array<{ esimTranNo: string; usedBytes: bigint; totalBytes: bigint }>>;

  getBalance(): Promise<CanonicalBalance>;

  topupEsim?(params: {
    esimTranNo?: string;
    iccid?: string;
    packageCode: string;
    priceUsd: number;
  }): Promise<CanonicalOrderResult>;

  cancelEsim?(params: { esimTranNo?: string; iccid?: string }): Promise<void>;
}
