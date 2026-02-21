export const dynamic = 'force-dynamic';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/auth/admin';
import { ROLE_LABELS, ROLE_COLORS, type AdminRole } from '@/lib/admin/roles';
import Link from 'next/link';
import { Shield, ShieldCheck, Clock, Mail, Plus, Edit } from 'lucide-react';

interface AdminUser {
    id: string;
    user_id: string | null;
    email: string;
    role: AdminRole;
    two_factor_enabled: boolean;
    last_login_at: string | null;
    created_at: string;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default async function AdminUsersPage() {
    await requireSuperAdmin();
    const supabase = createSupabaseAdminClient();

    const { data: adminUsers } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
                    <p className="text-gray-600">Manage administrator access and roles</p>
                </div>
                <Link
                    href="/admin/users/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Admin
                </Link>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">2FA</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Login</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {(adminUsers as AdminUser[])?.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-bold text-gray-600">
                                                {user.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{user.email}</p>
                                            {user.user_id && (
                                                <p className="text-xs text-gray-500">Linked to auth user</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                                        {ROLE_LABELS[user.role]}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.two_factor_enabled ? (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span className="text-sm">Enabled</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-yellow-600">
                                            <Shield className="w-4 h-4" />
                                            <span className="text-sm">Disabled</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        {formatDate(user.last_login_at)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-500">{formatDate(user.created_at)}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <Link
                                        href={`/admin/users/${user.id}`}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {(!adminUsers || adminUsers.length === 0) && (
                    <div className="p-12 text-center text-gray-500">
                        No admin users configured
                    </div>
                )}
            </div>
        </div>
    );
}
