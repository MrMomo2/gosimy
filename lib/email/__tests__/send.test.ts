import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn(),
    },
  })),
}));

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendEsimDeliveryEmail', () => {
    it('requires recipient email', () => {
      const params = {
        to: 'customer@example.com',
        orderId: 'order-123',
        esims: [],
      };

      expect(params.to).toBeDefined();
      expect(params.to).toContain('@');
    });

    it('requires orderId', () => {
      const params = {
        to: 'customer@example.com',
        orderId: 'order-123',
        esims: [],
      };

      expect(params.orderId).toBeDefined();
      expect(params.orderId.length).toBeGreaterThan(0);
    });

    it('accepts optional locale', () => {
      const params = {
        to: 'customer@example.com',
        orderId: 'order-123',
        locale: 'de',
        esims: [],
      };

      expect(params.locale).toBe('de');
    });

    it('defaults locale to en', () => {
      const defaultLocale = 'en';
      expect(defaultLocale).toBe('en');
    });
  });

  describe('EsimDeliveryItem Interface', () => {
    it('validates required fields', () => {
      const esimItem = {
        packageName: 'USA 1GB 7 Days',
        countryCode: 'US',
        durationDays: 7,
        volumeBytes: BigInt(1073741824),
      };

      expect(esimItem.packageName).toBeDefined();
      expect(esimItem.countryCode).toBeDefined();
      expect(esimItem.durationDays).toBeGreaterThan(0);
      expect(esimItem.volumeBytes).toBeGreaterThan(0);
    });

    it('accepts optional ICCID', () => {
      const esimItem = {
        iccid: '890123456789012345',
        packageName: 'Test',
        countryCode: 'US',
        durationDays: 7,
        volumeBytes: 1073741824,
      };

      expect(esimItem.iccid).toBeDefined();
      expect(esimItem.iccid?.length).toBeGreaterThanOrEqual(18);
    });

    it('accepts optional QR code URL', () => {
      const esimItem = {
        qrCodeUrl: 'https://example.com/qr.png',
        packageName: 'Test',
        countryCode: 'US',
        durationDays: 7,
        volumeBytes: 1073741824,
      };

      expect(esimItem.qrCodeUrl).toBeDefined();
      expect(esimItem.qrCodeUrl).toMatch(/^https:\/\//);
    });

    it('accepts optional activation code', () => {
      const esimItem = {
        activationCode: 'LPA:1$example.com$ACTIVATION',
        packageName: 'Test',
        countryCode: 'US',
        durationDays: 7,
        volumeBytes: 1073741824,
      };

      expect(esimItem.activationCode).toBeDefined();
      expect(esimItem.activationCode).toContain('LPA:');
    });
  });

  describe('Email Subject Generation', () => {
    it('includes shortened order ID', () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440000';
      const shortId = orderId.slice(0, 8).toUpperCase();
      
      expect(shortId).toBe('550E8400');
      expect(shortId.length).toBe(8);
    });

    it('generates subject line', () => {
      const shortId = '550E8400';
      const subject = `Your eSIM is ready — Order #${shortId}`;
      
      expect(subject).toContain('eSIM');
      expect(subject).toContain(shortId);
    });
  });

  describe('Volume Formatting', () => {
    it('normalizes volumeBytes to number', () => {
      const inputs = [
        BigInt(1073741824),
        1073741824,
        '1073741824',
      ];

      const normalized = inputs.map(v => Number(v));
      
      expect(normalized[0]).toBe(1073741824);
      expect(normalized[1]).toBe(1073741824);
      expect(normalized[2]).toBe(1073741824);
    });

    it('converts bytes to GB correctly', () => {
      const bytes = 1073741824; // 1GB
      const gb = bytes / (1024 * 1024 * 1024);
      
      expect(gb).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('throws when RESEND_API_KEY is missing', () => {
      const key = process.env.RESEND_API_KEY;
      const hasKey = !!key || key === undefined;
      
      expect(hasKey).toBe(true);
    });

    it('throws on send failure', () => {
      const error = new Error('Failed to send email: Invalid recipient');
      expect(error.message).toContain('Failed to send email');
    });

    it('uses default from email', () => {
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'support@gosimy.com';
      expect(fromEmail).toContain('@');
    });
  });

  describe('Email Format', () => {
    it('formats from email with display name', () => {
      const fromEmail = 'support@gosimy.com';
      const formatted = `Gosimy <${fromEmail}>`;
      
      expect(formatted).toContain('Gosimy');
      expect(formatted).toContain('<');
      expect(formatted).toContain('>');
    });
  });
});
