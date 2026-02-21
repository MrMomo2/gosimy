'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { User, Mail, Save, Loader2 } from 'lucide-react';

interface Props {
  locale: string;
  user: {
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export function ProfileForm({ locale, user }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [fullName, setFullName] = useState(user.fullName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      router.refresh();
    }
  };

  const displayName = fullName || user.email.split('@')[0];
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Mail className="w-4 h-4" />
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Email is managed by your login provider
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <User className="w-4 h-4" />
            Display Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your name"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </form>
    </div>
  );
}
