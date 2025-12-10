"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, getUserVideos } from "@/lib/api";
import type { Video, UserProfile } from "@/types";
import VideoCard from "@/components/VideoCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import FollowButton from "@/components/FollowButton";
import UserAvatar from "@/components/UserAvatar";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    loadUserData();
  }, [userId, isAuthenticated, authLoading, router]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError("");
      const [profile, userVideos] = await Promise.all([
        getUserProfile(userId),
        getUserVideos(userId),
      ]);
      setUserProfile(profile);
      setVideos(userVideos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        is_following: isFollowing,
        follower_count: isFollowing
          ? userProfile.follower_count + 1
          : userProfile.follower_count - 1,
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ErrorMessage message={error || "User not found"} />
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <UserAvatar username={userProfile.username} size="lg" />
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{userProfile.username}</h1>
                <p className="text-gray-600 mb-4">{userProfile.email}</p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="font-semibold">{videos.length}</span>{" "}
                    <span className="text-gray-600">videos</span>
                  </div>
                  <div>
                    <span className="font-semibold">{userProfile.follower_count}</span>{" "}
                    <span className="text-gray-600">followers</span>
                  </div>
                  <div>
                    <span className="font-semibold">{userProfile.following_count}</span>{" "}
                    <span className="text-gray-600">following</span>
                  </div>
                </div>
              </div>
              {!isOwnProfile && (
                <FollowButton
                  userId={userId}
                  isFollowing={userProfile.is_following}
                  onFollowChange={handleFollowChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isOwnProfile ? "Your Videos" : "Videos"}
        </h2>
        {videos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">
              {isOwnProfile ? "You haven't uploaded any videos yet." : "No videos yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} showUser={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
