// Type definitions matching the FastAPI backend schemas

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface UserProfile extends User {
  is_following?: boolean | null;
  follower_count: number;
  following_count: number;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Video {
  id: string;
  title: string;
  recipe?: string | null;
  visibility: "public" | "private";
  blob_name: string;
  blob_url: string;
  user_id: string;
  created_at: string;
}

export interface VideoStreamResponse {
  url: string;
}

export interface FollowResponse {
  message: string;
  follow?: any | null;
}

export interface UnfollowResponse {
  message: string;
}

export interface MessageResponse {
  message: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface UploadVideoData {
  title: string;
  file: File;
  recipe?: string;
  visibility?: "public" | "private";
}
