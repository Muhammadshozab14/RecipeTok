"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getVideo, getUserProfile } from "@/lib/api";
import type { Video, UserProfile } from "@/types";
import VideoPlayer from "@/components/VideoPlayer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import FollowButton from "@/components/FollowButton";
import UserAvatar from "@/components/UserAvatar";

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;
  const [video, setVideo] = useState<Video | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    loadVideo();
  }, [videoId, isAuthenticated, authLoading, router]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      setError("");
      const videoData = await getVideo(videoId);
      setVideo(videoData);

      // Load user profile
      const profile = await getUserProfile(videoData.user_id);
      setUserProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load video");
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorMessage message={error || "Video not found"} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <VideoPlayer videoId={video.id} blobUrl={video.blob_url} className="w-full" />

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
              <div className="flex items-center gap-3 mb-4">
                <Link href={`/users/${video.user_id}`} className="flex items-center gap-2 hover:opacity-80">
                  <UserAvatar username={userProfile?.username || video.user_id} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {userProfile?.username || `User ${video.user_id.slice(0, 8)}`}
                    </p>
                    {userProfile && (
                      <p className="text-sm text-gray-500">
                        {userProfile.follower_count} followers
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            </div>
            {userProfile && (
              <FollowButton
                userId={video.user_id}
                isFollowing={userProfile.is_following}
                onFollowChange={handleFollowChange}
              />
            )}
          </div>

          {video.recipe && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Recipe</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{video.recipe}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              {video.visibility === "public" ? "Public" : "Private"}
            </span>
            <span>•</span>
            <span>
              {new Date(video.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
