import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Shield } from 'lucide-react';

import { useAuth } from '@/features/auth';
import { authApi } from '@/lib/django-api';
import { useToast } from '@/components/ui/toast';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');

  const mutation = useMutation({
    mutationFn: (data: { full_name: string }) => authApi.updateProfile(data),
    onSuccess: () => {
      refreshProfile();
      toast('Profile updated successfully');
      setIsEditing(false);
    },
  });

  function handleSave() {
    if (fullName.trim().length < 2) return;
    mutation.mutate({ full_name: fullName.trim() });
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-600 mt-1">View and manage your account</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <User className="w-8 h-8 text-[#1754cf]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{profile.full_name}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 capitalize">
                <Shield className="w-3 h-3" />
                {profile.role}
              </span>
            </div>
          </div>

          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</dt>
              {isEditing ? (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
                  />
                  <button
                    onClick={handleSave}
                    disabled={mutation.isPending || fullName.trim().length < 2}
                    className="rounded-lg bg-[#1754cf] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d3db4] disabled:opacity-50 transition-colors"
                  >
                    {mutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setFullName(profile.full_name);
                      setIsEditing(false);
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <dd className="mt-1 flex items-center justify-between">
                  <span className="text-sm text-gray-900">{profile.full_name}</span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-[#1754cf] hover:underline font-medium"
                  >
                    Edit
                  </button>
                </dd>
              )}
            </div>

            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                <Mail className="w-4 h-4 text-gray-400" />
                {profile.email}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{profile.role}</dd>
            </div>
          </dl>

          {mutation.error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">Failed to update profile. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
