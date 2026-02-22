// ─── eSIM Access raw API types ────────────────────────────────────────────────
// Base: https://api.esimaccess.com/api/v1/open
// Auth: Header RT-AccessCode

export interface EsimAccessResponse<T = unknown> {
  success: boolean;
  errorCode: string | null;
  errorMsg: string | null;
  /** Present when success=true */
  obj?: T;
  /** Alternative error indicator — "200010" = still processing */
  code?: string;
}

// ─── /location/list ───────────────────────────────────────────────────────────

export interface EsimAccessLocationListResponse extends EsimAccessResponse<{
  locationList: EsimAccessLocation[];
}> {}

export interface EsimAccessLocation {
  code: string;       // e.g. "US", "EU", "NA-3"
  name: string;       // e.g. "United States"
  type: 1 | 2;        // 1=country, 2=region
  subLocationList?: Array<{ code: string; name: string }> | null;
}

// ─── /package/list ───────────────────────────────────────────────────────────

export interface EsimAccessPackageListRequest {
  locationCode?: string;
  type?: 'TOPUP' | '';
  packageCode?: string;
  slug?: string;
  iccid?: string;
  dataType?: 1 | 2;
}

export interface EsimAccessPackageListResponse extends EsimAccessResponse<{
  packageList: EsimAccessPackage[];
}> {}

export interface EsimAccessPackage {
  packageCode: string;
  name: string;
  /** Price in provider units. Divide by 10_000 to get USD. e.g. 90000 → $9.00 */
  price: number;
  currencyCode: string;
  /** Data volume in BYTES */
  volume: number;
  unusedValidTime: number;
  duration: number;
  durationUnit: string;     // "DAY"
  dataType: 1 | 2;
  location: string;         // Primary location code
  locationCode?: string;
  description: string;
  activeType: number;
  speed?: string;
  network?: string;
  type?: 'TOPUP';
  slug?: string;
  retailPrice?: number;
  locationNetworkList?: Array<{
    locationName: string;
    locationLogo?: string;
    operatorList: Array<{
      operatorName: string;
      networkType: string;
    }>;
  }>;
}

// ─── /esim/order ─────────────────────────────────────────────────────────────

export interface EsimAccessOrderRequest {
  transactionId: string;
  packageInfoList: Array<{
    packageCode: string;
    count: number;
    /** Number of days for daily plans (dataType=2), 1-365 */
    periodNum?: number;
  }>;
}

export interface EsimAccessOrderResponse extends EsimAccessResponse<{
  orderNo: string;
}> {}

// ─── /esim/query ─────────────────────────────────────────────────────────────

export interface EsimAccessQueryRequest {
  orderNo?: string;
  iccid?: string;
  pager: {
    pageNum: number;
    pageSize: number;
  };
}

export interface EsimAccessQueryResponse extends EsimAccessResponse<{
  esimList: EsimAccessEsimProfile[];
}> {}

export interface EsimAccessEsimProfile {
  orderNo?: string;
  esimTranNo: string;       // Per-eSIM transaction ID (use for topup/cancel)
  iccid: string;
  imsi?: string;
  msisdn?: string;
  /** eSIM lifecycle: GENERATED → RELEASED → ENABLED → EXPIRED */
  esimStatus: string;
  /** SM-DP+ provisioning: RELEASED = ready to download */
  smdpStatus: string;
  /** LPA format: "LPA:1$<smdp-address>$<activation-code>" */
  qrCodeUrl: string;
  /** Raw activation code (matching code portion of qrCodeUrl) */
  ac: string;
  /** Total data in bytes */
  totalVolume: number;
  /** Used data in bytes */
  orderUsage: number;
  expiredTime?: string;     // ISO timestamp
  orderTime?: string;
  /** Android quick install URL (v2.5+) */
  androidInstallUrl?: string;
  /** eSIM state: Active, Suspended, Deactivated */
  state?: string;
}

// ─── /esim/usage/query ───────────────────────────────────────────────────────

export interface EsimAccessUsageRequest {
  esimTranNoList: string[];
}

export interface EsimAccessUsageResponse extends EsimAccessResponse<{
  esimUsageList: Array<{
    esimTranNo: string;
    totalVolume: number;
    orderUsage: number;
    remainingVolume: number;
  }>;
}> {}

// ─── /esim/topup ─────────────────────────────────────────────────────────────

export interface EsimAccessTopupRequest {
  esimTranNo?: string;
  iccid?: string;
  packageCode: string;
  transactionId: string;
  amount: number;           // Price in provider units
}

// ─── /esim/cancel ────────────────────────────────────────────────────────────

export interface EsimAccessCancelRequest {
  esimTranNo: string;
  iccid?: string;
}

// ─── /esim/suspend ────────────────────────────────────────────────────────────

export interface EsimAccessSuspendRequest {
  esimTranNo?: string;
  iccid?: string;
}

// ─── /esim/resume ────────────────────────────────────────────────────────────

export interface EsimAccessResumeRequest {
  esimTranNo?: string;
  iccid?: string;
}

// ─── /esim/compatible ────────────────────────────────────────────────────────

export interface EsimAccessCompatibleRequest {
  iccid: string;
}

export interface EsimAccessCompatibleResponse extends EsimAccessResponse<{
  compatibleList: Array<{
    packageCode: string;
    name: string;
    volume: number;
    price: number;
    duration: number;
    durationUnit: string;
  }>;
}> {}

// ─── /balance/query ──────────────────────────────────────────────────────────

export interface EsimAccessBalanceResponse extends EsimAccessResponse<{
  balance?: number;
  amount?: number;
}> {
  /** Balance may also appear at root level */
  balance?: number;
}

// ─── Webhook payloads ────────────────────────────────────────────────────────
// Signature: HMAC-SHA256(rawBody, ESIM_ACCESS_SECRET_KEY)
// Header: RT-Signature

export type EsimAccessWebhookEvent =
  | { notifyType: 'ORDER_STATUS'; obj: { orderNo: string; orderStatus: string; transactionId: string } }
  | { notifyType: 'ESIM_STATUS'; obj: { iccid: string; esimStatus: string } }
  | { notifyType: 'DATA_USAGE'; obj: { iccid: string; totalVolume: number; orderUsage: number } }
  | { notifyType: 'VALIDITY_USAGE'; obj: { iccid: string; expiredTime: string; remainingHours: number } };
