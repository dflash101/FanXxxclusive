import { Link } from 'react-router-dom';
import { useProfiles } from '@/hooks/useProfiles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

const Landing = () => {
  const { profiles, loading } = useProfiles();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Gallery</h1>
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {profiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-card/80 backdrop-blur-sm rounded-lg p-12 max-w-md mx-auto border border-border">
              <h2 className="text-xl font-semibold mb-4">No Profiles Yet</h2>
              <p className="text-muted-foreground mb-6">No profiles have been uploaded yet.</p>
              <Link to="/admin">
                <Button>Go to Admin Panel</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <Link key={profile.id} to={`/profile/${profile.id}`}>
                <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
                  <div className="aspect-[3/4] overflow-hidden">
                    {profile.cover_image_url || (profile.images && profile.images[0]) ? (
                      <img
                        src={profile.cover_image_url || profile.images?.[0]?.image_url}
                        alt={profile.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{profile.name}</h3>
                    {profile.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{profile.description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Landing;