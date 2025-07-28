
export interface ProfileImage {
  id: string;
  profile_id: string;
  image_url: string;
  is_locked: boolean;
  display_order: number;
}

export interface Profile {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  created_at?: string;
  updated_at?: string;
  images?: ProfileImage[];
}
