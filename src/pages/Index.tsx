
import { Link } from 'react-router-dom';
import ProfileCard from '@/components/ProfileCard';
import { Profile } from '@/types/Profile';
import { useSupabaseProfiles } from '@/hooks/useSupabaseProfiles';
import { Header } from '@/components/Header';

const Index = () => {
  const { profiles, loading } = useSupabaseProfiles();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground text-lg">Loading profiles...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto border border-border">
              <h2 className="text-2xl font-semibold mb-4">No Profiles Yet</h2>
              <p className="text-muted-foreground mb-6">Admin needs to upload some profiles first.</p>
              <Link 
                to="/admin" 
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
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
              />
            ))}
          </div>
        )}
      </main>

    </div>
  );
};

export default Index;
