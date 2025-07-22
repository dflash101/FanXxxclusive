
export interface ProfileImage {
  id: string;
  url: string;
  isLocked: boolean;
  isCover: boolean;
}

export interface Profile {
  id: string;
  name: string;
  age?: number;
  location?: string;
  bio?: string;
  description?: string;
  images: ProfileImage[];
  isUnlocked?: boolean;
  unlockPrice?: number;
  createdAt?: string;
}
