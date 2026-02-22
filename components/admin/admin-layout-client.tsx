'use client';

import { usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/admin';
import { generateCsrfToken } from '@/lib/auth/csrf';
import { hasPermission, ROLE_LABELS, ROLE_COLORS, type AdminRole } from '@/lib/admin/roles';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard, CreditCard, Wifi, DollarSign,
    AlertTriangle, Tag, Users, BarChart3, Shield, Settings,
    FileText, LogOut, ShieldCheck, Bell, Gauge, Download, MessageCircle
} from 'lucide-react';
import { DarkModeToggle } from './dark-mode-toggle';

const inter = Inter({ subsets: ['latin'] });

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

interface Admin {
    id: string;
    email: string | undefined;
    role: AdminRole;
    twoFactorEnabled: boolean;
}

export function AdminLayoutClient({ 
    children, 
    admin,
    csrfToken 
}: { 
    children: React.ReactNode;
    admin: Admin;
    csrfToken: string;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const isDark = localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDarkMode(isDark);
    }, []);

    const navItems = allNavItems.filter(item =>
        hasPermission(admin.role, item.permission)
    );

    return (
        <html lang="en" className={`${inter.className} ${darkMode ? 'dark' : ''}`} data-scroll-behavior="smooth">
            <body className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {/* Mobile sidebar backdrop */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                
                <div className="flex min-h-screen">
                    {/* Sidebar */}
                    <aside className={`
                        fixed lg:static inset-y-0 left-0 z-50 
                        w-64 bg-gray-900 dark:bg-gray-950 text-white 
                        flex flex-col transform transition-transform duration-200
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    `}>
                        <div className="p-4 lg:p-6 border-b border-gray-800 dark:border-gray-800">
                            <Link href="/admin" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <LayoutDashboard className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-lg">Gosimy Admin</span>
                            </Link>
                        </div>
                        <nav className="flex-1 px-3 lg:px-4 py-4 space-y-1 overflow-y-auto">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 lg:px-4 py-2.5 rounded-lg text-sm transition-colors ${
                                        pathname === item.href
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="p-4 border-t border-gray-800">
                            <div className="flex items-start gap-3 px-2 py-2">
                                <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                    {admin.email?.charAt(0).toUpperCase() ?? '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate">{admin.email ?? 'Unknown'}</p>
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

                    {/* Main content */}
                    <main className="flex-1 min-w-0">
                        {/* Top bar */}
                        <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <span className="font-bold">Gosimy Admin</span>
                            <DarkModeToggle />
                        </header>

                        <div className="hidden lg:flex sticky top-0 z-30 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-4 items-center justify-between">
                            <div />
                            <DarkModeToggle />
                        </div>

                        <div className="p-4 lg:p-8 w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </body>
        </html>
    );
}
