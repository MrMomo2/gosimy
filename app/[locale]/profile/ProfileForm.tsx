'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { User, Mail, Save, Loader2, Lock, Download, Trash2, Monitor, LogOut } from 'lucide-react';

interface Props {
  locale: string;
  user: {
    email: string;
    fullName: string;
    avatarUrl: string | null;
    provider: string;
  };
}

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch('/api/user/csrf-token');
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  return data.token;
}

export function ProfileForm({ locale, user }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [signingOut, setSigningOut] = useState(false);

  // Display name
  const [fullName, setFullName] = useState(user.fullName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete account
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'error'; text: string } | null>(null);

  const displayName = fullName || user.email.split('@')[0];
  const initials = displayName.charAt(0).toUpperCase();

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameLoading(true);
    setNameMessage(null);

    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });

    setNameLoading(false);
    if (error) {
      setNameMessage({ type: 'error', text: error.message });
    } else {
      setNameMessage({ type: 'success', text: 'Profile updated successfully!' });
      router.refresh();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setPasswordLoading(true);
    try {
      const csrfToken = await fetchCsrfToken();
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, csrfToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMessage({ type: 'error', text: data.error });
      } else {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteMessage(null);
    setDeleteLoading(true);
    try {
      const csrfToken = await fetchCsrfToken();
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: deleteEmail, csrfToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteMessage({ type: 'error', text: data.error });
      } else {
        window.location.href = `/${locale}`;
      }
    } catch {
      setDeleteMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    if (!confirm('This will sign you out of all devices. You will need to sign in again.')) {
      return;
    }
    setSigningOut(true);
    try {
      await fetch('/api/user/sessions', { method: 'POST' });
      window.location.href = `/${locale}/auth/login`;
    } catch {
      alert('Failed to sign out');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile header + display name */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="w-20 h-20 rounded-full object-cover" />
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

        <form onSubmit={handleNameSubmit} className="p-6 space-y-6">
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
            <p className="text-xs text-muted-foreground mt-1">Email is managed by your login provider</p>
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

          {nameMessage && (
            <div className={`p-3 rounded-lg text-sm ${nameMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {nameMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={nameLoading}
            className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {nameLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Change Password
          </h3>
        </div>
        <div className="p-6">
          {user.provider !== 'email' ? (
            <p className="text-sm text-muted-foreground">
              Your password is managed by your {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)} account. To change it, update your account settings there.
            </p>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {passwordMessage && (
                <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {passwordMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Change Password
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Your Data */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" />
            Your Data
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Download a copy of all your personal data including orders and eSIMs as a JSON file.
          </p>
          <a
            href="/api/user/export"
            download
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold px-6 py-2 rounded-lg hover:bg-secondary/80 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download My Data
          </a>
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Sessions
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of all devices and sessions. You'll need to sign in again on all devices.
          </p>
          <button
            onClick={handleSignOutAll}
            disabled={signingOut}
            className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sign Out All Devices
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm">
        <div className="p-6 border-b border-red-100">
          <h3 className="font-semibold text-red-600 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Danger Zone
          </h3>
        </div>
        <div className="p-6">
          {!deleteOpen ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete your account and anonymise your order history. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setDeleteOpen(true)}
                className="shrink-0 flex items-center gap-2 border border-red-300 text-red-600 font-semibold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                This will permanently delete your account. Your order history will be anonymised but retained for legal purposes.
                <br />
                <strong>Type your email address to confirm:</strong>
              </p>
              <input
                type="email"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
                placeholder={user.email}
                className="w-full border border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
              />

              {deleteMessage && (
                <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">
                  {deleteMessage.text}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteOpen(false); setDeleteEmail(''); setDeleteMessage(null); }}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteEmail !== user.email}
                  className="flex items-center gap-2 bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Permanently Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
