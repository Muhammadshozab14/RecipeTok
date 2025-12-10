"use client";

import { useState } from "react";
import { followUser, unfollowUser } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean | null | undefined;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ userId, isFollowing: initialIsFollowing, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Don't show follow button for own profile
  if (user?.id === userId) {
    return null;
  }

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      alert(error instanceof Error ? error.message : "Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
        isFollowing
          ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
          : "bg-blue-500 text-white hover:bg-blue-600"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {loading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
