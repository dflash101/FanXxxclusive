
import { useState, useEffect } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { Profile } from '@/types/Profile';
import ProfileManager from './ProfileManager';
import CreateProfile from './CreateProfile';
import { safeLocalStorageGet, safeLocalStorageSet } from '@/utils/imageUtils';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showCreateProfile, setShowCreateProfile] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    const savedProfiles = safeLocalStorageGet('profiles') || [];
    setProfiles(savedProfiles);
  };

  const handleCreateProfile = (newProfile: Profile) => {
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    safeLocalStorageSet('profiles', updatedProfiles);
    setShowCreateProfile(false);
  };

  const handleUpdateProfile = (updatedProfile: Profile) => {
    const updatedProfiles = profiles.map(profile => 
      profile.id === updatedProfile.id ? updatedProfile : profile
    );
    setProfiles(updatedProfiles);
    safeLocalStorageSet('profiles', updatedProfiles);
  };

  const handleDeleteProfile = (profileId: string) => {
    const updatedProfiles = profiles.filter(profile => profile.id !== profileId);
    setProfiles(updatedProfiles);
    safeLocalStorageSet('profiles', updatedProfiles);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateProfile(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
            >
              <Plus size={20} />
              Create Profile
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No profiles created yet</p>
            <p className="text-gray-500">Click "Create Profile" to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {profiles.map((profile) => (
              <ProfileManager
                key={profile.id}
                profile={profile}
                onUpdate={handleUpdateProfile}
                onDelete={handleDeleteProfile}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Profile Modal */}
      {showCreateProfile && (
        <CreateProfile
          onClose={() => setShowCreateProfile(false)}
          onCreate={handleCreateProfile}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
