
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EsimAccessProvider } from '../client';
import { fulfillOrder } from '@/lib/fulfillment/fulfill-order';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createSupabaseAdminClient: vi.fn(),
}));

vi.mock('@/lib/providers', () => ({
    getProvider: vi.fn(),
}));

// Mock email sending
vi.mock('@/lib/email/send', () => ({
    sendEsimDeliveryEmail: vi.fn(),
}));

// Mock the provider class partially to spy on methods
const mockPlaceOrder = vi.fn();
const mockQueryEsim = vi.fn();
const mockCancelEsim = vi.fn();

// Mock getProvider to return our mocked provider
import { getProvider } from '@/lib/providers';
(getProvider as any).mockReturnValue({
    placeOrder: mockPlaceOrder, // Return orderNo-123
    queryEsim: mockQueryEsim,   // Return released status
    cancelEsim: mockCancelEsim,
});

describe('eSIM Purchase and Refund Flow', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup Mock Supabase Client
        mockSupabase = {
            from: vi.fn(() => mockSupabase),
            select: vi.fn(() => mockSupabase),
            insert: vi.fn(() => mockSupabase),
            update: vi.fn(() => mockSupabase),
            eq: vi.fn(() => mockSupabase),
            in: vi.fn(() => mockSupabase),
            single: vi.fn(),
            maybeSingle: vi.fn(),
            rpc: vi.fn(),
            auth: {
                admin: {
                    getUserById: vi.fn()
                }
            }
        };
        (createSupabaseAdminClient as any).mockReturnValue(mockSupabase);
    });

    it('should successfully fulfill an order (Purchase Flow)', async () => {
        const orderId = 'test-order-id';

        // 1. Mock Database Responses
        mockSupabase.rpc.mockResolvedValue({ data: true }); // Lock acquired
        mockSupabase.maybeSingle.mockResolvedValue({ data: null }); // Not already fulfilled

        const mockOrder = {
            id: orderId,
            status: 'paid',
            user_id: 'test-user',
            guest_email: 'test@example.com',
            order_items: [{
                id: 'item-1',
                provider: 'esim_access',
                package_code: 'TEST-PKG',
                quantity: 1,
                unit_price_cents: 1000, // $10.00
                volume_bytes: 1000000,
                duration_days: 7,
            }]
        };

        // Chain of mock responses for Supabase calls in fulfillOrder:
        mockSupabase.single
            .mockResolvedValueOnce({ data: { id: 'log-1' } })      // insert fulfillment_log "started"
            .mockResolvedValueOnce({ data: mockOrder })            // select order
            .mockResolvedValueOnce({ data: { price_usd: 5.0 } })   // select packages_cache
            .mockResolvedValueOnce({ data: { id: 'esim-1' } });    // insert esims

        // 2. Mock Provider Responses
        mockPlaceOrder.mockResolvedValue({
            providerOrderNo: 'PROVIDER-ORDER-123',
            status: 'processing'
        });

        mockQueryEsim.mockResolvedValue({
            esimTranNo: 'TRAN-456',
            iccid: '89000000000000000000',
            smdpStatus: 'RELEASED',
            qrCodeUrl: 'https://qrcode.url',
            activationCode: 'LPA:1$smdp$activation',
        });

        // 3. Execute
        const result = await fulfillOrder(orderId);

        // 4. Verify
        expect(result.success).toBe(true);
        expect(mockPlaceOrder).toHaveBeenCalledWith('TEST-PKG', 1, 5.0);
        expect(mockQueryEsim).toHaveBeenCalledWith('PROVIDER-ORDER-123');

        // Check if eSIM was updated in DB with correct data
        expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
            iccid: '89000000000000000000',
            status: 'active',
            activation_code: 'LPA:1$smdp$activation'
        }));
    });

    it('should successfully cancel an eSIM (Refund Flow)', async () => {
        // Instantiate actual client
        const provider = new EsimAccessProvider('fake-api-key');

        // Spy on the private 'request' method by casting to any
        const requestSpy = vi.fn().mockResolvedValue({ success: true, obj: {} });
        (provider as any).request = requestSpy;

        // Execute cancel
        await provider.cancelEsim({ esimTranNo: 'TRAN-456' });

        // Verify
        expect(requestSpy).toHaveBeenCalledWith('/esim/cancel', {
            esimTranNo: 'TRAN-456',
            iccid: undefined
        });

        // Test with ICCID
        await provider.cancelEsim({ iccid: '89000000000000000000' });
        expect(requestSpy).toHaveBeenCalledWith('/esim/cancel', {
            esimTranNo: '',
            iccid: '89000000000000000000'
        });
    });
});
