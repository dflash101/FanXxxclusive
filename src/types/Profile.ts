
export interface ProfileImage {
  id: string;
  url: string;
  isCover: boolean;
}

export interface ProfileVideo {
  id: string;
  url: string;
  isCover: boolean;
  thumbnail?: string;
}

export interface Profile {
  id: string;
  name: string;
  age?: number;
  location?: string;
  bio?: string;
  description?: string;
  images: ProfileImage[];
  videos: ProfileVideo[];
  createdAt?: string;
}
