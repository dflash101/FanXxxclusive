
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from '@/components/ProfileCard';
import PaymentModal from '@/components/PaymentModal';
import { Profile } from '@/types/Profile';
import { useSupabaseProfiles } from '@/hooks/useSupabaseProfiles';
import { usePhotoUnlocks } from '@/hooks/usePhotoUnlocks';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { profiles, loading } = useSupabaseProfiles();
  const { user } = useAuth();
  const { getUnlockedPhotosForProfile } = usePhotoUnlocks(user?.id);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const { toast } = useToast();

  const handleUnlockProfile = (profileId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to unlock profiles",
        variant: "destructive",
      });
      return;
    }
    setSelectedProfileId(profileId);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful!",
      description: "Profile unlocked successfully",
      variant: "default",
    });
    setSelectedProfileId('');
  };

  const isProfileUnlocked = (profile: Profile) => {
    if (!user) return false;
    const unlockedPhotos = getUnlockedPhotosForProfile(profile.id);
    return profile.isUnlocked || unlockedPhotos.length === profile.images.length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
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
                className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200"
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
                isUnlocked={isProfileUnlocked(profile)}
                onUnlock={() => handleUnlockProfile(profile.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {selectedProfileId && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          profile={profiles.find(p => p.id === selectedProfileId)!}
          amount={19.99}
          purchaseType="package"
        />
      )}
    </div>
  );
};

export default Index;
