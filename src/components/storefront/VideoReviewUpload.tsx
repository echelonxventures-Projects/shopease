"use client";

import { useState, useEffect } from "react";
import { createVideoReview, listVideoReviews } from "@/server/actions/commerce-actions";
import { Button } from "@/components/ui/button";
import { Video, Play, Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface VideoReviewUploadProps {
  reviewId: string;
  onUploaded?: () => void;
}

export function VideoReviewUpload({ reviewId, onUploaded }: VideoReviewUploadProps) {
  const [videos, setVideos] = useState<{ id: string; videoUrl: string }[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      const data = await listVideoReviews(reviewId);
      setVideos(data);
    } catch {
      // Non-critical
    }
  };

  useEffect(() => { fetchVideos(); }, [reviewId]);

  const handleUpload = async () => {
    if (!videoUrl.trim()) {
      toast.error("Enter a video URL (YouTube, Vimeo, or direct link)");
      return;
    }
    setUploading(true);
    try {
      await createVideoReview(reviewId, videoUrl.trim());
      setVideoUrl("");
      toast.success("Video review added");
      fetchVideos();
      onUploaded?.();
    } catch {
      toast.error("Failed to add video");
    } finally {
      setUploading(false);
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match?.[1] || null;
  };

  return (
    <div className="space-y-3">
      {/* Existing videos */}
      {videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((v) => {
            const ytId = extractYouTubeId(v.videoUrl);
            return (
              <div key={v.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                {ytId ? (
                  playingId === v.id ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                      className="w-full h-48 rounded-lg"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      onClick={() => setPlayingId(v.id)}
                      className="relative w-20 h-14 rounded-lg overflow-hidden bg-black flex items-center justify-center"
                    >
                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                      <Play className="w-6 h-6 text-white absolute" />
                    </button>
                  )
                ) : (
                  <Button variant="outline" size="sm" onClick={() => window.open(v.videoUrl, "_blank")}>
                    <LinkIcon className="w-4 h-4 mr-1" />
                    Open Video
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add video URL */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 border rounded-lg px-3">
          <Video className="w-4 h-4 text-gray-400" />
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Paste YouTube or video URL..."
            className="flex-1 py-2 text-sm outline-none bg-transparent"
          />
        </div>
        <Button onClick={handleUpload} disabled={uploading || !videoUrl.trim()} size="sm">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Video"}
        </Button>
      </div>
    </div>
  );
}
