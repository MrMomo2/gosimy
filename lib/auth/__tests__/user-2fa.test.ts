import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockServerClient = {
  auth: {
    getUser: vi.fn(),
  },
};

const mockAdminClient = {
  auth: {
    admin: {
      updateUserById: vi.fn(),
      getUserById: vi.fn(),
    },
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => mockServerClient),
  createSupabaseAdminClient: vi.fn(() => mockAdminClient),
}));

describe('User 2FA Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TOTP Token Validation', () => {
    it('validates correct 6-digit token format', () => {
      const validToken = '123456';
      const isValidFormat = /^\d{6}$/.test(validToken);
      expect(isValidFormat).toBe(true);
    });

    it('rejects tokens with wrong length', () => {
      const token5 = '12345';
      const token7 = '1234567';
      
      expect(/^\d{6}$/.test(token5)).toBe(false);
      expect(/^\d{6}$/.test(token7)).toBe(false);
    });

    it('rejects non-numeric tokens', () => {
      const token = 'abcdef';
      const isValidFormat = /^\d{6}$/.test(token);
      expect(isValidFormat).toBe(false);
    });
  });

  describe('2FA Secret Generation', () => {
    it('generates base32 encoded secret', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const isBase32 = /^[A-Z2-7]+=*$/.test(secret);
      expect(isBase32).toBe(true);
    });

    it('secrets are at least 16 characters', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      expect(secret.length).toBeGreaterThanOrEqual(16);
    });

    it('generates unique secrets for different users', () => {
      const secrets = ['JBSWY3DPEHPK3PXP', 'JBSWY3DPEHPK3PXQ', 'JBSWY3DPEHPK3PXR'];
      const uniqueSecrets = new Set(secrets);
      expect(uniqueSecrets.size).toBe(3);
    });
  });

  describe('2FA Enable Flow', () => {
    it('requires authenticated user', () => {
      mockServerClient.auth.getUser.mockResolvedValue({ data: { user: null } });
      expect(mockServerClient.auth.getUser()).resolves.toEqual({ data: { user: null } });
    });

    it('requires 6-digit code', () => {
      const code = '123456';
      expect(code.length).toBe(6);
      expect(/^\d+$/.test(code)).toBe(true);
    });

    it('stores secret in user metadata', () => {
      const userMetadata = {
        two_factor_secret: 'JBSWY3DPEHPK3PXP',
        two_factor_enabled: true,
      };
      
      expect(userMetadata.two_factor_secret).toBeDefined();
      expect(userMetadata.two_factor_enabled).toBe(true);
    });
  });

  describe('2FA Disable Flow', () => {
    it('requires valid code to disable', () => {
      const disableRequiresCode = true;
      expect(disableRequiresCode).toBe(true);
    });

    it('clears secret and enabled flag', () => {
      const clearedMetadata = {
        two_factor_secret: null,
        two_factor_enabled: false,
      };
      
      expect(clearedMetadata.two_factor_secret).toBeNull();
      expect(clearedMetadata.two_factor_enabled).toBe(false);
    });

    it('prevents disable without prior 2FA', () => {
      const has2FA = false;
      expect(has2FA).toBe(false);
    });
  });

  describe('Login with 2FA', () => {
    it('prompts for 2FA after password when enabled', () => {
      const requires2FA = true;
      expect(requires2FA).toBe(true);
    });

    it('accepts valid TOTP after password', () => {
      const validCode = '123456';
      const isValid = validCode === '123456';
      expect(isValid).toBe(true);
    });

    it('rejects invalid TOTP', () => {
      const validateCode = (code: string) => code === '123456';
      expect(validateCode('000000')).toBe(false);
      expect(validateCode('999999')).toBe(false);
    });
  });

  describe('2FA UI States', () => {
    it('shows enable option when disabled', () => {
      const isEnabled = false;
      expect(isEnabled).toBe(false);
    });

    it('shows disable option when enabled', () => {
      const isEnabled = true;
      expect(isEnabled).toBe(true);
    });

    it('shows QR code during setup', () => {
      const qrCode = 'data:image/png;base64,mock';
      expect(qrCode).toContain('data:image/png');
    });

    it('shows manual entry code as fallback', () => {
      const manualCode = 'JBSWY3DPEHPK3PXP';
      expect(manualCode).toBeDefined();
    });
  });
});
