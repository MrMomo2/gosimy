import '../globals.css';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth/admin';
import { generateCsrfToken } from '@/lib/auth/csrf';
import { AdminLayoutClient } from '@/components/admin/admin-layout-client';

export const metadata = {
    title: 'Gosimy Admin',
    description: 'Admin dashboard for Gosimy',
};

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

    return (
        <AdminLayoutClient 
            admin={admin}
            csrfToken={csrfToken}
        >
            {children}
        </AdminLayoutClient>
    );
}
