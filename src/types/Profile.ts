
export interface ProfileImage {
  id: string;
  url: string;
  isLocked: boolean;
  isCover: boolean;
}

export interface ProfileVideo {
  id: string;
  url: string;
  isLocked: boolean;
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
  isUnlocked?: boolean;
  unlockPrice?: number;
  photoPrice?: number;
  packagePrice?: number;
  videoPrice?: number;
  videoPackagePrice?: number;
  createdAt?: string;
}
