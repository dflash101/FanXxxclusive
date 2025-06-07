
import { useState, useEffect } from 'react';
import { Plus, LogOut, Upload, Star } from 'lucide-react';
import { Profile } from '@/types/Profile';
import ProfileManager from '@/components/ProfileManager';
import CreateProfile from '@/components/CreateProfile';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const savedProfiles = localStorage.getItem('profiles');
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    }
  }, []);

  const saveProfiles = (updatedProfiles: Profile[]) => {
    setProfiles(updatedProfiles);
    localStorage.setItem('profiles', JSON.stringify(updatedProfiles));
  };

  const handleCreateProfile = (profile: Profile) => {
    const updatedProfiles = [...profiles, profile];
    saveProfiles(updatedProfiles);
    setShowCreateForm(false);
  };

  const handleUpdateProfile = (updatedProfile: Profile) => {
    const updatedProfiles = profiles.map(p => 
      p.id === updatedProfile.id ? updatedProfile : p
    );
    saveProfiles(updatedProfiles);
  };

  const handleDeleteProfile = (profileId: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    saveProfiles(updatedProfiles);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm">Manage profiles and photos</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
            >
              <Plus size={18} />
              New Profile
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {profiles.length === 0 && !showCreateForm ? (
          <div className="text-center py-20">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto border border-gray-700">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-300 mb-4">No Profiles Created</h2>
              <p className="text-gray-400 mb-6">Start by creating your first profile with photos.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                <Plus size={18} />
                Create First Profile
              </button>
            </div>
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
      {showCreateForm && (
        <CreateProfile
          onClose={() => setShowCreateForm(false)}
          onCreate={handleCreateProfile}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
