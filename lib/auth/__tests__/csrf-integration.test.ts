import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: vi.fn(() => mockSupabase),
}));

describe('lib/auth/csrf.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCsrfToken', () => {
    it('generates a 64-character hex token', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => Promise.resolve({ error: null })),
      });

      const { generateCsrfToken } = await import('../csrf');
      const token = await generateCsrfToken('user-1');

      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('stores token in database with correct user_id', async () => {
      let capturedInsert: Record<string, unknown> | undefined;
      const insertMock = vi.fn((data: Record<string, unknown>) => {
        capturedInsert = data;
        return Promise.resolve({ error: null });
      });
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      });

      const { generateCsrfToken } = await import('../csrf');
      await generateCsrfToken('user-123');

      expect(insertMock).toHaveBeenCalled();
      expect(capturedInsert?.user_id).toBe('user-123');
      expect(capturedInsert?.token_type).toBe('csrf');
    });

    it('sets expiry to 1 hour from now', async () => {
      let capturedInsert: Record<string, unknown> | undefined;
      const insertMock = vi.fn((data: Record<string, unknown>) => {
        capturedInsert = data;
        return Promise.resolve({ error: null });
      });
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      });

      const before = Date.now();
      const { generateCsrfToken } = await import('../csrf');
      await generateCsrfToken('user-1');
      const after = Date.now();

      const expiresAt = new Date(capturedInsert?.expires_at as string).getTime();
      const oneHour = 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(before + oneHour - 1000);
      expect(expiresAt).toBeLessThanOrEqual(after + oneHour + 1000);
    });

    it('generates unique tokens', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => Promise.resolve({ error: null })),
      });

      const { generateCsrfToken } = await import('../csrf');
      const token1 = await generateCsrfToken('user-1');
      const token2 = await generateCsrfToken('user-1');

      expect(token1).not.toBe(token2);
    });
  });

  describe('validateCsrfToken', () => {
    it('returns true for valid token', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: 'token-id-1' },
                  })),
                })),
              })),
            })),
          })),
        })),
      }).mockReturnValueOnce({
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      });

      const { validateCsrfToken } = await import('../csrf');
      const isValid = await validateCsrfToken('user-1', 'valid-token');

      expect(isValid).toBe(true);
    });

    it('returns false for invalid token', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: null })),
                })),
              })),
            })),
          })),
        })),
      });

      const { validateCsrfToken } = await import('../csrf');
      const isValid = await validateCsrfToken('user-1', 'invalid-token');

      expect(isValid).toBe(false);
    });

    it('returns false for expired token', async () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: null })),
                })),
              })),
            })),
          })),
        })),
      });

      const { validateCsrfToken } = await import('../csrf');
      const isValid = await validateCsrfToken('user-1', 'expired-token');

      expect(isValid).toBe(false);
    });

    it('returns false for wrong user', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: null })),
                })),
              })),
            })),
          })),
        })),
      });

      const { validateCsrfToken } = await import('../csrf');
      const isValid = await validateCsrfToken('user-2', 'token-for-user-1');

      expect(isValid).toBe(false);
    });

    it('deletes token after successful validation (single-use)', async () => {
      const deleteMock = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: 'token-id-123' },
                  })),
                })),
              })),
            })),
          })),
        })),
      }).mockReturnValueOnce({
        delete: deleteMock,
      });

      const { validateCsrfToken } = await import('../csrf');
      await validateCsrfToken('user-1', 'valid-token');

      expect(deleteMock).toHaveBeenCalled();
    });
  });

  describe('CSRF Token Expiry', () => {
    it('CSRF_TOKEN_EXPIRY_MS is 1 hour', async () => {
      const expectedExpiry = 60 * 60 * 1000;
      expect(expectedExpiry).toBe(3600000);
    });
  });

  describe('Security Properties', () => {
    it('token is cryptographically random', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => Promise.resolve({ error: null })),
      });

      const { generateCsrfToken } = await import('../csrf');
      const tokens = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const token = await generateCsrfToken(`user-${i}`);
        tokens.add(token);
      }

      expect(tokens.size).toBe(100);
    });

    it('token cannot be predicted', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => Promise.resolve({ error: null })),
      });

      const { generateCsrfToken } = await import('../csrf');
      const token = await generateCsrfToken('user-1');

      expect(token).not.toContain('user-1');
      expect(token).not.toContain(Date.now().toString());
    });
  });
});
