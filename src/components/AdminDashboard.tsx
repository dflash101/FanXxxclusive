
import { useState, useEffect } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { Profile } from '@/types/Profile';
import ProfileManager from './ProfileManager';
import CreateProfile from './CreateProfile';
import { useSupabaseProfiles } from '@/hooks/useSupabaseProfiles';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const { profiles, loading, createProfile, updateProfile, deleteProfile } = useSupabaseProfiles();
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const { toast } = useToast();

  const handleCreateProfile = async (newProfile: Profile) => {
    try {
      await createProfile(newProfile);
      setShowCreateProfile(false);
      toast({
        title: "Success",
        description: "Profile created successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create profile",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async (updatedProfile: Profile) => {
    try {
      await updateProfile(updatedProfile);
      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await deleteProfile(profileId);
      toast({
        title: "Success",
        description: "Profile deleted successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            FanXxxclusive Admin
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
        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="grid w-full grid-cols-1 bg-gray-800/50">
            <TabsTrigger value="profiles" className="text-white data-[state=active]:bg-purple-600">Profiles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profiles" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400 text-lg">Loading profiles...</p>
              </div>
            ) : profiles.length === 0 ? (
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
          </TabsContent>
        </Tabs>
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
