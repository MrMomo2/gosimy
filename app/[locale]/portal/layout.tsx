export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

import { ChatProvider } from '@/components/portal/chat/ChatProvider';
import ChatWidget from '@/components/portal/chat/ChatWidget';

export default async function PortalLayout({ children, params }: Props) {
  const { locale } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <ChatProvider>
      {children}
      <ChatWidget />
    </ChatProvider>
  );
}
