"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Video, VideoStreamResponse } from "@/types";
import { getVideoStream } from "@/lib/api";
import UserAvatar from "./UserAvatar";

interface VideoCardProps {
  video: Video;
  showUser?: boolean;
}

export default function VideoCard({ video, showUser = true }: VideoCardProps) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fetch streaming URL for preview
    getVideoStream(video.id)
      .then((response: VideoStreamResponse) => {
        setStreamUrl(response.url);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [video.id]);

  return (
    <Link href={`/videos/${video.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-200">
        <div className="aspect-video bg-gray-200 relative overflow-hidden">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            </div>
          ) : error || !streamUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-4">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-xs text-gray-500">Video unavailable</p>
              </div>
            </div>
          ) : (
            <video
              src={streamUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              onError={() => setError(true)}
              onMouseEnter={(e) => {
                const target = e.target as HTMLVideoElement;
                target.play().catch(() => {
                  // Ignore play errors (autoplay restrictions)
                });
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLVideoElement;
                target.pause();
                target.currentTime = 0;
              }}
            />
          )}
          {video.visibility === "private" && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              Private
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {video.title}
          </h3>
          {showUser && (
            <Link
              href={`/users/${video.user_id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 mt-2 hover:opacity-80 transition-opacity"
            >
              <UserAvatar username={video.user_id} size="sm" />
              <span className="text-sm text-gray-600">User {video.user_id.slice(0, 8)}</span>
            </Link>
          )}
          {video.recipe && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{video.recipe}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
