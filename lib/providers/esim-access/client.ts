import type {
  IEsimProvider,
  CanonicalPackage,
  CanonicalOrderResult,
  CanonicalEsimStatus,
  CanonicalBalance,
  CanonicalLocation,
} from '../types';
import type {
  EsimAccessPackageListResponse,
  EsimAccessPackageListRequest,
  EsimAccessOrderResponse,
  EsimAccessQueryResponse,
  EsimAccessQueryRequest,
  EsimAccessBalanceResponse,
  EsimAccessLocationListResponse,
  EsimAccessUsageResponse,
  EsimAccessTopupRequest,
  EsimAccessCancelRequest,
} from './types';
import { adaptPackage, adaptEsimProfile, adaptLocation } from './adapter';

const BASE_URL = 'https://api.esimaccess.com/api/v1/open';

// API price field: divide by 10_000 to get USD (e.g. 90000 → $9.00)
const PRICE_DIVISOR = 10_000;

// Exponential-ish back-off: 15 attempts ≈ ~60 s total
const POLL_DELAYS_MS = [
  500, 1000, 1500, 2000, 2000, 2000,
  3000, 3000, 3000, 5000, 5000, 5000,
  10_000, 10_000, 10_000,
];

/** Thrown when the API returns code=200010 (still processing) */
export class EsimStillProcessingError extends Error {
  constructor() {
    super('eSIM still processing (code 200010)');
    this.name = 'EsimStillProcessingError';
  }
}

export class EsimAccessProvider implements IEsimProvider {
  readonly name = 'esim_access';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('ESIM_ACCESS_API_KEY is required');
    this.apiKey = apiKey;
  }

  // ─── HTTP helper ───────────────────────────────────────────────────────────
  // All eSIM Access endpoints are POST with JSON body
  private async request<T>(endpoint: string, body: unknown = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`eSIM Access HTTP ${res.status}: ${res.statusText}`);
    }

    try {
      return await res.json() as T;
    } catch {
      throw new Error(`eSIM Access returned non-JSON response for ${endpoint}`);
    }
  }

  // ─── List packages ─────────────────────────────────────────────────────────
  async listPackages(locationCode?: string): Promise<CanonicalPackage[]> {
    const body: EsimAccessPackageListRequest = {};
    if (locationCode) body.locationCode = locationCode.toUpperCase();

    const response = await this.request<EsimAccessPackageListResponse>('/package/list', body);

    if (!response.success || !response.obj) {
      throw new Error(`listPackages failed: ${response.errorMsg ?? 'unknown error'}`);
    }

    return response.obj.packageList.map(adaptPackage);
  }

  // ─── List locations ────────────────────────────────────────────────────────
  async listLocations(): Promise<CanonicalLocation[]> {
    const response = await this.request<EsimAccessLocationListResponse>('/location/list');

    if (!response.success || !response.obj) {
      throw new Error(`listLocations failed: ${response.errorMsg ?? 'unknown error'}`);
    }

    return response.obj.locationList.map(adaptLocation);
  }

  // ─── Place order ───────────────────────────────────────────────────────────
  // Returns immediately with providerOrderNo — eSIM is NOT yet provisioned.
  // Caller must poll queryEsim(providerOrderNo) until smdpStatus === 'RELEASED'.
  async placeOrder(
    packageCode: string,
    quantity: number,
    priceUsd: number,
  ): Promise<CanonicalOrderResult> {
    const transactionId = `gosimy_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const priceInUnits = Math.round(priceUsd * PRICE_DIVISOR);

    const response = await this.request<EsimAccessOrderResponse>('/esim/order', {
      transactionId,
      packageInfoList: [
        { packageCode, count: quantity },
      ],
    });

    if (!response.success || !response.obj) {
      throw new Error(`placeOrder failed: ${response.errorMsg ?? 'unknown error'}`);
    }

    return {
      providerOrderNo: response.obj.orderNo,
      status: 'processing',
    };
  }

  // ─── Query eSIM ────────────────────────────────────────────────────────────
  // identifier = orderNo (e.g. "B25012220580005") OR iccid (18–22 digits)
  // Throws EsimStillProcessingError when code === '200010' so the poller retries.
  async queryEsim(identifier: string): Promise<CanonicalEsimStatus> {
    const isIccid = /^\d{18,22}$/.test(identifier);

    const body: EsimAccessQueryRequest = {
      pager: { pageNum: 1, pageSize: 20 },
    };
    if (isIccid) {
      body.iccid = identifier;
    } else {
      body.orderNo = identifier;
    }

    const response = await this.request<EsimAccessQueryResponse>('/esim/query', body);

    // code === '200010' means the order is still being processed — tell caller to retry
    if (response.code === '200010') throw new EsimStillProcessingError();

    if (!response.success || !response.obj) {
      throw new Error(`queryEsim failed: ${response.errorMsg ?? 'unknown error'}`);
    }

    const esimList = response.obj.esimList;
    if (!esimList || esimList.length === 0) {
      throw new Error('queryEsim: empty esimList returned');
    }

    return adaptEsimProfile(esimList[0]);
  }

  // ─── Query usage ───────────────────────────────────────────────────────────
  async queryUsage(
    esimTranNos: string[],
  ): Promise<Array<{ esimTranNo: string; usedBytes: bigint; totalBytes: bigint }>> {
    const response = await this.request<EsimAccessUsageResponse>('/esim/usage/query', {
      esimTranNoList: esimTranNos,
    });

    if (!response.success || !response.obj) {
      throw new Error(`queryUsage failed: ${response.errorMsg ?? 'unknown error'}`);
    }

    return response.obj.esimUsageList.map((u) => ({
      esimTranNo: u.esimTranNo,
      usedBytes: BigInt(Math.round(u.orderUsage)),
      totalBytes: BigInt(Math.round(u.totalVolume)),
    }));
  }

  // ─── Balance ───────────────────────────────────────────────────────────────
  async getBalance(): Promise<CanonicalBalance> {
    const response = await this.request<EsimAccessBalanceResponse>('/balance/query');

    if (!response.success) {
      throw new Error(`getBalance failed: ${response.errorMsg ?? 'unknown error'}`);
    }

    // Amount may be in obj.balance, obj.amount, or root balance
    const raw = response.obj?.balance ?? response.obj?.amount ?? response.balance ?? 0;

    return {
      amount: raw / PRICE_DIVISOR, // provider units → USD
      currency: 'USD',
    };
  }

  // ─── Topup ─────────────────────────────────────────────────────────────────
  async topupEsim(params: {
    esimTranNo?: string;
    iccid?: string;
    packageCode: string;
    priceUsd: number;
  }): Promise<CanonicalOrderResult> {
    const transactionId = `gosimy_topup_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const body: EsimAccessTopupRequest = {
      packageCode: params.packageCode,
      transactionId,
      amount: Math.round(params.priceUsd * PRICE_DIVISOR),
    };
    if (params.esimTranNo) body.esimTranNo = params.esimTranNo;
    if (params.iccid) body.iccid = params.iccid;

    const response = await this.request<EsimAccessOrderResponse>('/esim/topup', body);

    if (!response.success || !response.obj) {
      throw new Error(`topupEsim failed: ${response.errorMsg ?? 'unknown error'}`);
    }

    return {
      providerOrderNo: response.obj.orderNo,
      status: 'processing',
    };
  }

  // ─── Cancel ────────────────────────────────────────────────────────────────
  async cancelEsim(params: { esimTranNo?: string; iccid?: string }): Promise<void> {
    if (!params.esimTranNo && !params.iccid) {
      throw new Error('cancelEsim requires esimTranNo or iccid');
    }

    const body: EsimAccessCancelRequest = {
      esimTranNo: params.esimTranNo ?? '',
      iccid: params.iccid,
    };

    const response = await this.request<{
      success: boolean;
      errorCode: string | null;
      errorMsg: string | null;
    }>('/esim/cancel', body);

    if (!response.success) {
      throw new Error(`cancelEsim failed: ${response.errorMsg ?? 'unknown error'}`);
    }
  }
}
