"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getContentById, updateWatchProgress, getSimilarContent,
  getContentRatings, rateContent, markReviewHelpful, toggleWatchlist,
  requestDownload, getProfiles, getStreamingConfig,
} from "@/server/actions/streaming-actions";

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [content, setContent] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [ratings, setRatings] = useState<{ ratings: any[]; average: number; count: number }>({ ratings: [], average: 0, count: 0 });
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  // Enhanced player state
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipRecap, setShowSkipRecap] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  // Parental PIN gate
  const [pinRequired, setPinRequired] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  // Thumbs rating
  const [thumbs, setThumbs] = useState<"up" | "down" | null>(null);
  // Trailer hover
  const [hoverTrailer, setHoverTrailer] = useState(false);
  const trailerRef = useRef<HTMLVideoElement>(null);
  // Config (all values from admin)
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    getStreamingConfig().then(setConfig);
    getContentById(id).then((c) => {
      setContent(c);
      checkParentalGate(c);
    });
    getSimilarContent(id).then(setSimilar);
    getContentRatings(id).then(setRatings);
  }, [id]);

  const checkParentalGate = async (c: any) => {
    if (!c) return;
    try {
      const profileStr = localStorage.getItem("streaming_profile");
      if (!profileStr) return;
      const profile = JSON.parse(profileStr);
      const cfg = await getStreamingConfig();
      const maturityOrder = cfg?.maturityLevels || ["U", "U/A 7+", "U/A 13+", "U/A 16+", "A"];
      const contentLevel = maturityOrder.indexOf(c.maturityRating || maturityOrder[0]);
      const profileLevel = maturityOrder.indexOf(profile.maturityRating || maturityOrder[maturityOrder.length - 2]);
      if (contentLevel > profileLevel && profile.pin) {
        setPinRequired(true);
      }
    } catch {}
  };

  const verifyPin = () => {
    const profileStr = localStorage.getItem("streaming_profile");
    if (!profileStr) { setPinRequired(false); return; }
    const profile = JSON.parse(profileStr);
    if (pinInput === profile.pin) { setPinRequired(false); setPinError(false); }
    else setPinError(true);
  };

  // Progress tracking
  useEffect(() => {
    if (!showPlayer || !videoRef.current) return;
    const interval = setInterval(() => {
      if (videoRef.current && id) updateWatchProgress(id, Math.floor(videoRef.current.currentTime)).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [showPlayer, id]);

  // Skip intro detection (configurable durations)
  useEffect(() => {
    if (!showPlayer || !videoRef.current) return;
    const recapEnd = config?.skipRecapDuration ?? 30;
    const introEnd = config?.skipIntroDuration ?? 120;
    const handleTime = () => {
      const t = videoRef.current?.currentTime || 0;
      setShowSkipIntro(t > recapEnd && t < introEnd);
      setShowSkipRecap(t < recapEnd && (content?.type === "EPISODE" || content?.episodeNumber));
    };
    videoRef.current.addEventListener("timeupdate", handleTime);
    return () => videoRef.current?.removeEventListener("timeupdate", handleTime);
  }, [showPlayer, content, config]);

  const skipIntro = () => { if (videoRef.current) videoRef.current.currentTime = config?.skipIntroDuration ?? 120; };
  const skipRecap = () => { if (videoRef.current) videoRef.current.currentTime = config?.skipRecapDuration ?? 30; };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setShowSpeedMenu(false);
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) { await document.exitPictureInPicture(); setIsPiP(false); }
      else { await videoRef.current.requestPictureInPicture(); setIsPiP(true); }
    } catch {}
  };

  const handleThumb = async (type: "up" | "down") => {
    setThumbs(type);
    await rateContent(id, type === "up" ? 5 : 1);
    setRatings(await getContentRatings(id));
  };

  const handleRate = async () => {
    if (myRating < 1) return;
    await rateContent(id, myRating, myReview || undefined);
    setRatings(await getContentRatings(id));
  };

  if (!content) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full" /></div>;

  // Parental PIN gate
  if (pinRequired) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-semibold">This content is rated {content.maturityRating}</h2>
          <p className="text-gray-400 text-sm">Enter your profile PIN to watch</p>
          <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))} className="bg-gray-800 border border-gray-600 rounded px-4 py-2 text-center text-2xl tracking-widest w-40" placeholder="••••" />
          {pinError && <p className="text-red-500 text-sm">Incorrect PIN</p>}
          <div className="flex gap-2 justify-center">
            <button onClick={verifyPin} className="bg-red-600 px-6 py-2 rounded hover:bg-red-700">Unlock</button>
            <button onClick={() => router.back()} className="bg-gray-700 px-6 py-2 rounded hover:bg-gray-600">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const episodes = content.episodes?.filter((e: any) => e.seasonNumber === selectedSeason) || [];
  const seasons = [...new Set(content.episodes?.map((e: any) => e.seasonNumber) || [])].sort();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Enhanced Video Player */}
      {showPlayer ? (
        <div className="relative w-full aspect-video bg-black group">
          <video ref={videoRef} className="w-full h-full" controls autoPlay src={content.videoUrl || "/placeholder-video.mp4"}>
            {content.subtitles?.map((sub: string, i: number) => (
              <track key={i} kind="subtitles" src={`/subtitles/${sub}.vtt`} srcLang={sub} label={sub} default={selectedSubtitle === sub} />
            ))}
            <track kind="captions" />
          </video>

          {/* Player Overlay Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setShowPlayer(false)} className="bg-black/70 px-3 py-1 rounded text-sm hover:bg-black">← Back</button>
            <div className="flex gap-2">
              {/* Subtitles */}
              <div className="relative">
                <button onClick={() => setShowSubtitleMenu(!showSubtitleMenu)} className="bg-black/70 px-3 py-1 rounded text-sm hover:bg-black">CC</button>
                {showSubtitleMenu && (
                  <div className="absolute right-0 top-8 bg-black/90 rounded p-2 space-y-1 min-w-[120px]">
                    <button onClick={() => { setSelectedSubtitle(null); setShowSubtitleMenu(false); }} className={`block w-full text-left px-2 py-1 text-xs rounded ${!selectedSubtitle ? "bg-white/20" : "hover:bg-white/10"}`}>Off</button>
                    {(content.subtitles || ["English", "Hindi", "Spanish"]).map((s: string) => (
                      <button key={s} onClick={() => { setSelectedSubtitle(s); setShowSubtitleMenu(false); }} className={`block w-full text-left px-2 py-1 text-xs rounded ${selectedSubtitle === s ? "bg-white/20" : "hover:bg-white/10"}`}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
              {/* Speed */}
              <div className="relative">
                <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="bg-black/70 px-3 py-1 rounded text-sm hover:bg-black">{playbackSpeed}x</button>
                {showSpeedMenu && (
                  <div className="absolute right-0 top-8 bg-black/90 rounded p-2 space-y-1">
                    {(config?.playbackSpeeds || ["0.5", "0.75", "1", "1.25", "1.5", "2"]).map((s: string) => (
                      <button key={s} onClick={() => changeSpeed(+s)} className={`block w-full text-left px-3 py-1 text-xs rounded ${playbackSpeed === +s ? "bg-white/20" : "hover:bg-white/10"}`}>{s}x</button>
                    ))}
                  </div>
                )}
              </div>
              {/* PiP */}
              <button onClick={togglePiP} className="bg-black/70 px-3 py-1 rounded text-sm hover:bg-black">{isPiP ? "Exit PiP" : "PiP"}</button>
            </div>
          </div>

          {/* Skip Intro Button */}
          {showSkipIntro && (
            <button onClick={skipIntro} className="absolute bottom-20 right-8 bg-white/20 border border-white px-6 py-2 rounded text-sm font-medium hover:bg-white/30 backdrop-blur">Skip Intro →</button>
          )}
          {/* Skip Recap Button */}
          {showSkipRecap && (
            <button onClick={skipRecap} className="absolute bottom-20 right-8 bg-white/20 border border-white px-6 py-2 rounded text-sm font-medium hover:bg-white/30 backdrop-blur">Skip Recap →</button>
          )}
        </div>
      ) : (
        /* Hero Banner with trailer auto-play on hover */
        <div className="relative h-[70vh] bg-cover bg-center" style={{ backgroundImage: `url(${content.bannerUrl || content.thumbnailUrl || ""})` }} onMouseEnter={() => { if (content.trailerUrl) setHoverTrailer(true); }} onMouseLeave={() => setHoverTrailer(false)}>
          {hoverTrailer && content.trailerUrl && (
            <video ref={trailerRef} className="absolute inset-0 w-full h-full object-cover" src={content.trailerUrl} autoPlay muted loop />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-2">{content.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-300 mb-4">
              <span className="text-green-500 font-semibold">{ratings.average ? `${(ratings.average * 20).toFixed(0)}% Match` : "New"}</span>
              <span>{content.releaseDate ? new Date(content.releaseDate).getFullYear() : ""}</span>
              <span className="border border-gray-500 px-1 text-xs">{content.maturityRating || "U/A"}</span>
              {content.duration && <span>{Math.floor(content.duration / 60)}m</span>}
              <span className="border border-gray-500 px-1 text-xs">{content.quality?.[0] || "HD"}</span>
            </div>
            <p className="text-gray-300 max-w-2xl mb-6 line-clamp-3">{content.description}</p>
            <div className="flex gap-3 items-center">
              <button onClick={() => setShowPlayer(true)} className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded font-semibold hover:bg-gray-200">▶ Play</button>
              <button onClick={async () => { const r = await toggleWatchlist(id); setInWatchlist(r.added); }} className="flex items-center gap-2 bg-gray-600/70 px-4 py-2 rounded hover:bg-gray-600">{inWatchlist ? "✓ My List" : "+ My List"}</button>
              {/* Thumbs up/down */}
              <button onClick={() => handleThumb("up")} className={`w-9 h-9 rounded-full border flex items-center justify-center ${thumbs === "up" ? "bg-white text-black" : "border-gray-400 hover:border-white"}`}>👍</button>
              <button onClick={() => handleThumb("down")} className={`w-9 h-9 rounded-full border flex items-center justify-center ${thumbs === "down" ? "bg-white text-black" : "border-gray-400 hover:border-white"}`}>👎</button>
              {/* Download */}
              <button onClick={async () => { await requestDownload(id); }} className="w-9 h-9 rounded-full border border-gray-400 flex items-center justify-center hover:border-white" title="Download">⬇</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* Content Info */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2"><p className="text-gray-300">{content.description}</p></div>
          <div className="text-sm text-gray-400 space-y-1">
            {content.cast?.length > 0 && <p><span className="text-gray-500">Cast:</span> {content.cast.join(", ")}</p>}
            {content.director && <p><span className="text-gray-500">Director:</span> {content.director}</p>}
            {content.genres?.length > 0 && <p><span className="text-gray-500">Genres:</span> {content.genres.join(", ")}</p>}
            {content.language && <p><span className="text-gray-500">Language:</span> {content.language}</p>}
            {content.subtitles?.length > 0 && <p><span className="text-gray-500">Subtitles:</span> {content.subtitles.join(", ")}</p>}
          </div>
        </div>

        {/* Episodes (for Series) */}
        {content.type === "SERIES" && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-semibold">Episodes</h2>
              {seasons.length > 1 && (
                <select value={selectedSeason} onChange={(e) => setSelectedSeason(Number(e.target.value))} className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm">
                  {seasons.map((s: any) => <option key={s} value={s}>Season {s}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-3">
              {episodes.map((ep: any, i: number) => (
                <div key={ep.id} className="flex gap-4 p-3 rounded hover:bg-gray-800/50 cursor-pointer" onClick={() => router.push(`/streaming/watch/${ep.id}`)}>
                  <span className="text-gray-500 text-lg w-8 text-center">{ep.episodeNumber || i + 1}</span>
                  <div className="w-40 h-24 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                    {ep.thumbnailUrl && <img src={ep.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{ep.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">{ep.description}</p>
                    {ep.duration && <span className="text-xs text-gray-500">{Math.floor(ep.duration / 60)}m</span>}
                  </div>
                </div>
              ))}
              {episodes.length === 0 && <p className="text-gray-500">No episodes available for this season.</p>}
            </div>
          </div>
        )}

        {/* Ratings & Reviews */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Ratings & Reviews</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-500">{ratings.average.toFixed(1)}</div>
              <div className="text-sm text-gray-400">{ratings.count} reviews</div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setMyRating(star)} className={`text-2xl ${star <= myRating ? "text-yellow-500" : "text-gray-600"}`}>★</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            <input value={myReview} onChange={(e) => setMyReview(e.target.value)} placeholder="Write a review..." className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
            <button onClick={handleRate} disabled={myRating < 1} className="bg-red-600 px-4 py-2 rounded text-sm font-medium disabled:opacity-50 hover:bg-red-700">Submit</button>
          </div>
          <div className="space-y-4">
            {ratings.ratings.map((r: any) => (
              <div key={r.id} className="border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  {r.spoiler && <span className="text-xs bg-red-900 px-1 rounded">Spoiler</span>}
                </div>
                {r.review && <p className="text-sm text-gray-300 mt-1">{r.review}</p>}
                <button onClick={() => markReviewHelpful(r.id)} className="text-xs text-gray-500 mt-1 hover:text-gray-300">👍 Helpful ({r.helpful})</button>
              </div>
            ))}
          </div>
        </div>

        {/* Similar Content */}
        {similar.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">More Like This</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {similar.map((item: any) => (
                <Link key={item.id} href={`/streaming/watch/${item.id}`} className="group">
                  <div className="aspect-[2/3] bg-gray-800 rounded overflow-hidden">
                    {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">{item.title}</div>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">{item.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
