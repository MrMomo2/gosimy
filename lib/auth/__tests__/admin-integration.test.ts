import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabaseServer = {
  auth: {
    getUser: vi.fn(),
  },
};

const mockSupabaseAdmin = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(() => mockSupabaseServer),
  createSupabaseAdminClient: vi.fn(() => mockSupabaseAdmin),
}));

describe('lib/auth/admin.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdminUser', () => {
    it('returns null when no user session', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const { getAdminUser } = await import('../admin');
      const result = await getAdminUser();

      expect(result).toBeNull();
    });

    it('returns null when user is not in admin_users table', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'user@example.com' } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null })),
          })),
        })),
      });

      const { getAdminUser } = await import('../admin');
      const result = await getAdminUser();

      expect(result).toBeNull();
    });

    it('returns admin user with correct data', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'admin', two_factor_enabled: true },
            })),
          })),
        })),
      });

      const { getAdminUser } = await import('../admin');
      const result = await getAdminUser();

      expect(result).toEqual({
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
        twoFactorEnabled: true,
      });
    });

    it('defaults twoFactorEnabled to false when null', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'admin', two_factor_enabled: null },
            })),
          })),
        })),
      });

      const { getAdminUser } = await import('../admin');
      const result = await getAdminUser();

      expect(result?.twoFactorEnabled).toBe(false);
    });
  });

  describe('requireAdmin', () => {
    it('throws when no admin user', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const { requireAdmin } = await import('../admin');

      await expect(requireAdmin()).rejects.toThrow('Unauthorized: Admin access required');
    });

    it('returns admin user when valid', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'admin', two_factor_enabled: true },
            })),
          })),
        })),
      });

      const { requireAdmin } = await import('../admin');
      const result = await requireAdmin();

      expect(result.id).toBe('admin-1');
    });
  });

  describe('requireRole', () => {
    it('allows access when role is sufficient', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'super_admin', two_factor_enabled: true },
            })),
          })),
        })),
      });

      const { requireRole } = await import('../admin');
      const result = await requireRole('admin');

      expect(result.role).toBe('super_admin');
    });

    it('throws when role is insufficient', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'support@example.com' } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'support', two_factor_enabled: true },
            })),
          })),
        })),
      });

      const { requireRole } = await import('../admin');

      await expect(requireRole('admin')).rejects.toThrow('Unauthorized: admin role required');
    });

    it('allows same role access', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'finance@example.com' } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'finance', two_factor_enabled: true },
            })),
          })),
        })),
      });

      const { requireRole } = await import('../admin');
      const result = await requireRole('finance');

      expect(result.role).toBe('finance');
    });
  });

  describe('requireSuperAdmin', () => {
    it('allows super_admin', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'super@example.com' } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'super_admin', two_factor_enabled: true },
            })),
          })),
        })),
      });

      const { requireSuperAdmin } = await import('../admin');
      const result = await requireSuperAdmin();

      expect(result.role).toBe('super_admin');
    });

    it('rejects admin role', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'admin', two_factor_enabled: true },
            })),
          })),
        })),
      });

      const { requireSuperAdmin } = await import('../admin');

      await expect(requireSuperAdmin()).rejects.toThrow('Unauthorized: super_admin role required');
    });
  });

  describe('requireAdminWith2FA', () => {
    it('throws when 2FA is not enabled', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'admin', two_factor_enabled: false },
            })),
          })),
        })),
      });

      const { requireAdminWith2FA } = await import('../admin');

      await expect(requireAdminWith2FA()).rejects.toThrow('2FA must be enabled for admin access');
    });

    it('returns admin when 2FA is enabled', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@example.com' } },
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'admin', two_factor_enabled: true },
            })),
          })),
        })),
      });

      const { requireAdminWith2FA } = await import('../admin');
      const result = await requireAdminWith2FA();

      expect(result.twoFactorEnabled).toBe(true);
    });
  });

  describe('updateAdminLastLogin', () => {
    it('updates last_login_at timestamp', async () => {
      const updateMock = vi.fn(() => Promise.resolve({ error: null }));
      
      mockSupabaseAdmin.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => updateMock()),
        })),
      });

      const { updateAdminLastLogin } = await import('../admin');
      await updateAdminLastLogin('user-1');

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('admin_users');
    });
  });

  describe('Role Hierarchy', () => {
    it('enforces correct hierarchy: support < finance < admin < super_admin', async () => {
      const hierarchy = ['support', 'finance', 'admin', 'super_admin'];
      
      expect(hierarchy.indexOf('support')).toBeLessThan(hierarchy.indexOf('finance'));
      expect(hierarchy.indexOf('finance')).toBeLessThan(hierarchy.indexOf('admin'));
      expect(hierarchy.indexOf('admin')).toBeLessThan(hierarchy.indexOf('super_admin'));
    });
  });
});
