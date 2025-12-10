"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoStreamResponse } from "@/types";
import { getVideoStream } from "@/lib/api";
import LoadingSpinner from "./LoadingSpinner";

interface VideoPlayerProps {
  videoId: string;
  blobUrl?: string;
  className?: string;
}

export default function VideoPlayer({ videoId, blobUrl, className = "" }: VideoPlayerProps) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Always fetch streaming URL to ensure we have a valid SAS token
    // blobUrl from the API is not directly playable (needs SAS token)
    getVideoStream(videoId)
      .then((response: VideoStreamResponse) => {
        setStreamUrl(response.url);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load video");
        setLoading(false);
      });
  }, [videoId]);

  if (loading) {
    return (
      <div className={`aspect-video bg-gray-900 flex items-center justify-center ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !streamUrl) {
    return (
      <div className={`aspect-video bg-gray-900 flex items-center justify-center text-white ${className}`}>
        <p>{error || "Video not available"}</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={streamUrl}
      controls
      className={`w-full h-full object-contain bg-black rounded-lg ${className}`}
      playsInline
      onError={(e) => {
        console.error("Video playback error:", e);
        setError("Failed to play video. The video format may not be supported.");
      }}
    >
      Your browser does not support the video tag.
    </video>
  );
}
