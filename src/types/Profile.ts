
export interface ProfileImage {
  id: string;
  url: string;
  isLocked: boolean;
  isCover: boolean;
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  images: ProfileImage[];
  createdAt: string;
}
