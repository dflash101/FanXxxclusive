
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from '@/components/ProfileCard';
import { Profile } from '@/types/Profile';
import { safeLocalStorageGet, safeLocalStorageSet } from '@/utils/imageUtils';

const Index = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [unlockedProfiles, setUnlockedProfiles] = useState<string[]>([]);

  useEffect(() => {
    loadData();
    
    // Add window focus listener to refresh data when returning from admin
    const handleFocus = () => {
      loadData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadData = () => {
    const savedProfiles = safeLocalStorageGet('profiles') || [];
    const savedUnlocked = safeLocalStorageGet('unlockedProfiles') || [];
    
    console.log('Loading profiles:', savedProfiles);
    console.log('Loading unlocked:', savedUnlocked);
    
    setProfiles(savedProfiles);
    setUnlockedProfiles(savedUnlocked);
  };

  const handleUnlockProfile = (profileId: string) => {
    const newUnlocked = [...unlockedProfiles, profileId];
    setUnlockedProfiles(newUnlocked);
    safeLocalStorageSet('unlockedProfiles', newUnlocked);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            FanXxxclusive
          </h1>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Refresh
            </button>
            <Link 
              to="/admin" 
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              Admin Access
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {profiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto border border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-300 mb-4">No Profiles Yet</h2>
              <p className="text-gray-400 mb-6">Admin needs to upload some profiles first.</p>
              <Link 
                to="/admin" 
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                Go to Admin Panel
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isUnlocked={unlockedProfiles.includes(profile.id)}
                onUnlock={() => handleUnlockProfile(profile.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
