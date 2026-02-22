export const dynamic = 'force-dynamic';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from './ProfileForm';

type Props = { params: Promise<{ locale: string }> };

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 dark:text-gray-100">Profile</h1>
        <p className="text-muted-foreground mb-8 dark:text-gray-400">Manage your account settings</p>
        <ProfileForm
          locale={locale}
          user={{
            email: user.email ?? '',
            fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
            avatarUrl: user.user_metadata?.avatar_url || null,
            provider: (user.app_metadata?.provider as string) ?? 'email',
          }}
        />
      </div>
    </div>
  );
}
