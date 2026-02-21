import '../globals.css';
import { Inter } from 'next/font/google';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/admin';
import { generateCsrfToken } from '@/lib/auth/csrf';
import { hasPermission, ROLE_LABELS, ROLE_COLORS, type AdminRole } from '@/lib/admin/roles';
import Link from 'next/link';
import {
    LayoutDashboard, Package, CreditCard, Wifi, DollarSign,
    AlertTriangle, Tag, Users, BarChart3, Shield, Settings,
    FileText, LogOut, ShieldCheck, Bell, Gauge, Download, MessageCircle
} from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Gosimy Admin',
    description: 'Admin dashboard for Gosimy',
};

const allNavItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', permission: 'orders' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', permission: 'analytics' },
    { href: '/admin/customers', icon: Users, label: 'Customers', permission: 'customers' },
    { href: '/admin/orders', icon: CreditCard, label: 'Orders', permission: 'orders' },
    { href: '/admin/esims', icon: Wifi, label: 'eSIMs', permission: 'esims' },
    { href: '/admin/coupons', icon: Tag, label: 'Coupons', permission: 'coupons' },
    { href: '/admin/refunds', icon: DollarSign, label: 'Refunds', permission: 'refunds' },
    { href: '/admin/issues', icon: AlertTriangle, label: 'Issues', permission: 'orders' },
    { href: '/admin/support', icon: MessageCircle, label: 'Support', permission: 'orders' },
    { href: '/admin/rate-limits', icon: Gauge, label: 'Rate Limits', permission: 'settings' },
    { href: '/admin/audit', icon: FileText, label: 'Audit Log', permission: 'audit' },
    { href: '/admin/export', icon: Download, label: 'Export', permission: 'analytics' },
    { href: '/admin/users', icon: Shield, label: 'Admin Users', permission: 'settings' },
    { href: '/admin/alerts', icon: Bell, label: 'Alerts', permission: 'settings' },
    { href: '/admin/settings', icon: Settings, label: 'Settings', permission: 'settings' },
];

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const admin = await getAdminUser();

    if (!admin) {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            redirect('/en/auth/login?redirect=/admin');
        }
        redirect('/en');
    }

    const csrfToken = await generateCsrfToken(admin.id);

    const navItems = allNavItems.filter(item =>
        hasPermission(admin.role, item.permission)
    );

    return (
        <html lang="en" className={inter.className} data-scroll-behavior="smooth">
            <body className="min-h-screen bg-gray-100 text-gray-900">
                <div className="flex min-h-screen">
                    <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white z-50 flex flex-col">
                        <div className="p-6 border-b border-gray-800">
                            <Link href="/admin" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <LayoutDashboard className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-lg">Gosimy Admin</span>
                            </Link>
                        </div>
                        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm"
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="p-4 border-t border-gray-800">
                            <div className="flex items-start gap-3 px-2 py-2">
                                <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                    {admin.email?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate">{admin.email}</p>
                                        {admin.twoFactorEnabled && (
                                            <span title="2FA Enabled">
                                                <ShieldCheck className="w-4 h-4 text-green-400" />
                                            </span>
                                        )}
                                    </div>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[admin.role]}`}>
                                        {ROLE_LABELS[admin.role]}
                                    </span>
                                </div>
                            </div>
                            <form action="/api/auth/signout" method="POST" className="mt-3">
                                <input type="hidden" name="csrf_token" value={csrfToken} />
                                <button
                                    type="submit"
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </form>
                            <input type="hidden" id="csrf-token" value={csrfToken} />
                        </div>
                    </aside>
                    <main className="flex-1 ml-64 p-8 w-full">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
