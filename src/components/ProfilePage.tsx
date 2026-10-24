import { useState } from 'react';
import { Sparkles, AtSign, User, LogOut, ArrowLeft, Check, Loader2, Camera } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface ProfilePageProps {
  onNavigate: (page: 'chat') => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { profile, updateProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaved(false);

    const { error } = await updateProfile({
      full_name: fullName.trim(),
      avatar_url: avatarUrl.trim() || null,
    });

    if (error) {
      setSaveError(error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const initials = (profile?.full_name || profile?.username || '?')
    .split(/[\s@_.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50/30 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header with back button */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-all hover:bg-purple-50 hover:text-purple-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chat
          </button>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl border border-purple-100 bg-white/90 p-8 shadow-sm backdrop-blur-md">
          {/* Avatar section */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="h-24 w-24 rounded-full border-4 border-purple-100 object-cover shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-purple-100 bg-gradient-to-br from-purple-400 to-purple-600 text-2xl font-bold text-white shadow-sm">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-purple-500 shadow-sm">
                <Camera className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-800">{profile?.full_name || 'Your name'}</h2>
            <p className="mt-0.5 text-sm text-gray-400">@{profile?.username}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-5">
            {/* Display name */}
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-purple-200 bg-white px-10 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            {/* Username (read-only) */}
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={profile?.username ?? ''}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-10 py-3 text-sm text-gray-500"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">Username cannot be changed</p>
            </div>

            {/* Avatar URL */}
            <div>
              <label htmlFor="avatarUrl" className="mb-1.5 block text-sm font-medium text-gray-700">
                Avatar URL <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
            </div>

            {/* Error message */}
            {saveError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {saveError}
              </div>
            )}

            {/* Success message */}
            {saved && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Changes saved successfully
              </div>
            )}

            {/* Save button */}
            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-purple-600 hover:to-purple-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-purple-100" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-500 transition-all hover:bg-red-50 hover:shadow-sm active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Sparkles className="h-3 w-3 text-purple-300" />
          Dear Science — Study Assistant
        </div>
      </div>
    </div>
  );
}
