import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAuth } from '@/utils/adminAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, LogOut, Upload, Lock, Unlock, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PriceEditor } from '@/components/PriceEditor';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profiles, loading, createProfile, updateImageLockStatus, deleteProfile } = useProfiles();
  const { toast } = useToast();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({ name: '', description: '' });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!adminAuth.isAuthenticated()) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    adminAuth.logout();
    navigate('/admin');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.name.trim()) {
      toast({
        title: "Error",
        description: "Profile name is required.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    const profileData = {
      ...newProfile,
      images: []
    };
    const result = await createProfile(profileData, selectedFiles);
    
    if (result.success) {
      toast({
        title: "Profile Created",
        description: "New profile has been created successfully.",
      });
      setIsCreateModalOpen(false);
      setNewProfile({ name: '', description: '' });
      setSelectedFiles([]);
    } else {
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    }
    setCreating(false);
  };

  const handleToggleLock = async (imageId: string, currentLockStatus: boolean) => {
    const result = await updateImageLockStatus(imageId, !currentLockStatus);
    if (result.success) {
      toast({
        title: currentLockStatus ? "Image Unlocked" : "Image Locked",
        description: `Image has been ${currentLockStatus ? 'unlocked' : 'locked'} successfully.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update image lock status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProfile = async (profileId: string, profileName: string) => {
    if (!confirm(`Are you sure you want to delete "${profileName}"? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteProfile(profileId);
    if (result.success) {
      toast({
        title: "Profile Deleted",
        description: "Profile has been deleted successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete profile.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to FanXXXclusive
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-fanxxxclusive-primary to-fanxxxclusive-secondary bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="profiles" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="images">Manage Images</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Profiles ({profiles.length})</h2>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Profile</DialogTitle>
                    <DialogDescription>
                      Add a new profile with images to the gallery.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newProfile.name}
                        onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                        placeholder="Enter profile name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProfile.description}
                        onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                        placeholder="Enter profile description (optional)"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="images">Images</Label>
                      <Input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="cursor-pointer"
                      />
                      {selectedFiles.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {selectedFiles.length} file(s) selected
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creating} className="flex-1">
                        {creating ? "Creating..." : "Create Profile"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <Card key={profile.id}>
                  <div className="aspect-[3/4] overflow-hidden">
                    {profile.cover_image_url || (profile.images && profile.images[0]) ? (
                      <img
                        src={profile.cover_image_url || profile.images?.[0]?.image_url}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    {profile.description && (
                      <CardDescription className="line-clamp-2">
                        {profile.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {profile.images?.length || 0} images
                      </span>
                      <Button
                        onClick={() => handleDeleteProfile(profile.id, profile.name)}
                        variant="destructive"
                        size="sm"
                        className="gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            <h2 className="text-xl font-semibold">Manage Image Lock Status</h2>
            
            {profiles.map((profile) => (
              <Card key={profile.id}>
                <CardHeader>
                  <CardTitle>{profile.name}</CardTitle>
                  <CardDescription>
                    Manage which images are locked or unlocked for this profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {profile.images?.map((image, index) => (
                      <div key={image.id} className="space-y-2">
                        <div className="aspect-square overflow-hidden rounded-lg border">
                          <img
                            src={image.image_url}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Image {index + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <Badge variant={image.is_locked ? "destructive" : "secondary"}>
                                {image.is_locked ? "Locked" : "Unlocked"}
                              </Badge>
                              <Button
                                onClick={() => handleToggleLock(image.id, image.is_locked)}
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                {image.is_locked ? (
                                  <Unlock className="w-3 h-3" />
                                ) : (
                                  <Lock className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <PriceEditor 
                              imageId={image.id}
                              currentPrice={image.price || 4.99}
                              onPriceUpdate={() => window.location.reload()}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(!profile.images || profile.images.length === 0) && (
                    <p className="text-muted-foreground text-center py-8">
                      No images uploaded for this profile yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;