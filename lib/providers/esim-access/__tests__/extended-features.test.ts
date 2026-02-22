import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EsimAccessProvider } from '../client';

describe('eSIM Access Provider - Extended Features', () => {
  let provider: EsimAccessProvider;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new EsimAccessProvider('fake-api-key');
    mockRequest = vi.fn();
    (provider as any).request = mockRequest;
  });

  describe('suspendEsim', () => {
    it('suspends eSIM by esimTranNo', async () => {
      mockRequest.mockResolvedValue({ success: true });

      await provider.suspendEsim({ esimTranNo: 'TRAN-123' });

      expect(mockRequest).toHaveBeenCalledWith('/esim/suspend', {
        esimTranNo: 'TRAN-123',
        iccid: undefined,
      });
    });

    it('suspends eSIM by iccid', async () => {
      mockRequest.mockResolvedValue({ success: true });

      await provider.suspendEsim({ iccid: '89000000000000000000' });

      expect(mockRequest).toHaveBeenCalledWith('/esim/suspend', {
        esimTranNo: '',
        iccid: '89000000000000000000',
      });
    });

    it('throws when neither esimTranNo nor iccid provided', async () => {
      await expect(provider.suspendEsim({})).rejects.toThrow('requires esimTranNo or iccid');
    });

    it('throws on API error', async () => {
      mockRequest.mockResolvedValue({ success: false, errorMsg: 'ESIM not found' });

      await expect(provider.suspendEsim({ esimTranNo: 'TRAN-123' })).rejects.toThrow('suspendEsim failed');
    });
  });

  describe('resumeEsim', () => {
    it('resumes eSIM by esimTranNo', async () => {
      mockRequest.mockResolvedValue({ success: true });

      await provider.resumeEsim({ esimTranNo: 'TRAN-123' });

      expect(mockRequest).toHaveBeenCalledWith('/esim/resume', {
        esimTranNo: 'TRAN-123',
        iccid: undefined,
      });
    });

    it('resumes eSIM by iccid', async () => {
      mockRequest.mockResolvedValue({ success: true });

      await provider.resumeEsim({ iccid: '89000000000000000000' });

      expect(mockRequest).toHaveBeenCalledWith('/esim/resume', {
        esimTranNo: '',
        iccid: '89000000000000000000',
      });
    });

    it('throws when neither esimTranNo nor iccid provided', async () => {
      await expect(provider.resumeEsim({})).rejects.toThrow('requires esimTranNo or iccid');
    });

    it('throws on API error', async () => {
      mockRequest.mockResolvedValue({ success: false, errorMsg: 'ESIM not found' });

      await expect(provider.resumeEsim({ esimTranNo: 'TRAN-123' })).rejects.toThrow('resumeEsim failed');
    });
  });

  describe('getCompatiblePackages', () => {
    it('returns compatible packages for ICCID', async () => {
      mockRequest.mockResolvedValue({
        success: true,
        obj: {
          compatibleList: [
            { packageCode: 'PKG-1', name: '1GB 7 Days', volume: 1073741824, price: 30000, duration: 7, durationUnit: 'DAY' },
            { packageCode: 'PKG-2', name: '3GB 30 Days', volume: 3221225472, price: 80000, duration: 30, durationUnit: 'DAY' },
          ],
        },
      });

      const result = await provider.getCompatiblePackages('89000000000000000000');

      expect(mockRequest).toHaveBeenCalledWith('/esim/compatible', { iccid: '89000000000000000000' });
      expect(result).toHaveLength(2);
      expect(result[0].packageCode).toBe('PKG-1');
      expect(result[0].priceUsd).toBe(3.0); // 30000 / 10000
      expect(result[1].volume).toBe(BigInt(3221225472));
    });

    it('throws on API error', async () => {
      mockRequest.mockResolvedValue({ success: false, errorMsg: 'Invalid ICCID' });

      await expect(provider.getCompatiblePackages('89000000000000000000')).rejects.toThrow('getCompatiblePackages failed');
    });

    it('throws when API returns empty response', async () => {
      mockRequest.mockResolvedValue({ success: true, obj: null });

      await expect(provider.getCompatiblePackages('89000000000000000000')).rejects.toThrow('getCompatiblePackages failed');
    });
  });

  describe('Android Install URL', () => {
    it('includes androidInstallUrl in eSIM profile', async () => {
      mockRequest.mockResolvedValue({
        success: true,
        obj: {
          esimList: [
            {
              esimTranNo: 'TRAN-123',
              iccid: '89000000000000000000',
              smdpStatus: 'RELEASED',
              esimStatus: 'ENABLED',
              state: 'Active',
              totalVolume: 1073741824,
              orderUsage: 0,
              ac: 'ACTIVATION-CODE',
              qrCodeUrl: 'https://qr.example.com/code.png',
              androidInstallUrl: 'https://install.esimgo.com/android/abc123',
            },
          ],
        },
      });

      const result = await provider.queryEsim('TRAN-123');

      expect(result.androidInstallUrl).toBe('https://install.esimgo.com/android/abc123');
      expect(result.state).toBe('Active');
    });
  });

  describe('iOS Install URL', () => {
    it('generates iosInstallUrl from activation code', async () => {
      mockRequest.mockResolvedValue({
        success: true,
        obj: {
          esimList: [
            {
              esimTranNo: 'TRAN-123',
              iccid: '89000000000000000000',
              smdpStatus: 'RELEASED',
              esimStatus: 'ENABLED',
              state: 'Active',
              totalVolume: 1073741824,
              orderUsage: 0,
              ac: 'LPA:1$rsp-esim.example.com$ACTIVECODE123',
              qrCodeUrl: 'https://qr.example.com/code.png',
            },
          ],
        },
      });

      const result = await provider.queryEsim('TRAN-123');

      expect(result.iosInstallUrl).toBe('https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA%3A1%24rsp-esim.example.com%24ACTIVECODE123');
      expect(result.activationCode).toBe('LPA:1$rsp-esim.example.com$ACTIVECODE123');
    });

    it('returns undefined iosInstallUrl when no activation code', async () => {
      mockRequest.mockResolvedValue({
        success: true,
        obj: {
          esimList: [
            {
              esimTranNo: 'TRAN-123',
              iccid: '89000000000000000000',
              smdpStatus: 'RELEASED',
              esimStatus: 'ENABLED',
              state: 'Active',
              totalVolume: 1073741824,
              orderUsage: 0,
            },
          ],
        },
      });

      const result = await provider.queryEsim('TRAN-123');

      expect(result.iosInstallUrl).toBeUndefined();
      expect(result.activationCode).toBeUndefined();
    });
  });
});
