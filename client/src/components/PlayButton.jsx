import {
  FastForward,
  Loader2,
  Music,
  Pause,
  Play,
  Rewind,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { playTickSound } from "../utils/sound";
import { getTrendingTracks, searchTracks } from "../services/music";

const TRENDING_ARTISTS = [
  "The Weeknd",
  "Arijit Singh",
  "Drake",
  "Taylor Swift",
  "Post Malone",
  "Billie Eilish",
  "Ed Sheeran",
  "Dua Lipa",
  "Coldplay",
  "Justin Bieber",
  "Travis Scott",
];

export default function PlayButton({ customTracks = null, onTrackChange = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isAskingArtist, setIsAskingArtist] = useState(false);

  // Favorite artist persisted in localStorage
  const [favArtist, setFavArtist] = useState(
    () => localStorage.getItem("music_fav_artist") || ""
  );
  const [activeQuery, setActiveQuery] = useState(() => {
    const fav = localStorage.getItem("music_fav_artist");
    if (fav) return fav;
    const q = localStorage.getItem("music_query");
    return q && q !== "Lo-Fi" ? q : "";
  });

  const [songs, setSongs] = useState(() => customTracks || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isShuffle, setIsShuffle] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const wrapperRef = useRef(null);
  const audioRef = useRef(null);
  const scrubRef = useRef(null);
  const loadedTrackIdRef = useRef(null);

  // If custom tracks are passed via props, use them
  useEffect(() => {
    if (customTracks && customTracks.length > 0) {
      setSongs(customTracks);
      setCurrentIndex(0);
    }
  }, [customTracks]);

  // Initial load: prioritize saved favorite artist, or fallback to authentic trending
  useEffect(() => {
    if (customTracks && customTracks.length > 0) return;

    let isCancelled = false;
    setIsLoading(true);

    const loadInitialMusic = async () => {
      try {
        const queryToLoad = favArtist || activeQuery;
        if (queryToLoad && queryToLoad.toLowerCase() !== "trending") {
          const favTracks = await searchTracks(queryToLoad, 25);
          if (!isCancelled && favTracks && favTracks.length > 0) {
            setSongs(favTracks);
            setCurrentIndex(0);
            return;
          }
        }

        // Default to clean trending hits
        const trending = await getTrendingTracks(25);
        if (!isCancelled && trending && trending.length > 0) {
          setSongs(trending);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.warn("Initial music fetch fallback:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadInitialMusic();

    return () => {
      isCancelled = true;
    };
  }, [favArtist, customTracks]);

  // Currently playing track directly from live stream data
  const currentSong = songs[currentIndex] || null;

  // Notify parent component if callback provided
  useEffect(() => {
    if (currentSong && onTrackChange) {
      onTrackChange(currentSong);
    }
  }, [currentSong, onTrackChange]);

  // Audio Playback Controller
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const streamUrl = currentSong?.streamUrl || currentSong?.previewUrl;
    if (!streamUrl) {
      audio.pause();
      return;
    }

    if (loadedTrackIdRef.current !== currentSong.id) {
      loadedTrackIdRef.current = currentSong.id;
      audio.src = streamUrl;
      if (isPlaying) {
        setIsBuffering(true);
        audio.play().catch((err) => {
          console.warn("Audio play prevented:", err);
          setIsPlaying(false);
          setIsBuffering(false);
        });
      }
    } else {
      if (isPlaying && audio.paused) {
        setIsBuffering(true);
        audio.play().catch((err) => {
          console.warn("Audio play prevented:", err);
          setIsPlaying(false);
          setIsBuffering(false);
        });
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
        setIsBuffering(false);
      }
    }
  }, [currentSong?.id, currentSong?.streamUrl, currentSong?.previewUrl, isPlaying]);

  // Audio Event Listeners (Buffering, loaded metadata, error recovery, auto-advance)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isScrubbing) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else if (currentSong?.durationSec && isFinite(currentSong.durationSec)) {
        setDuration(currentSong.durationSec);
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleCanPlay = () => setIsBuffering(false);

    const handleError = () => {
      console.warn("Audio playback stream error on:", currentSong?.title);
      setIsBuffering(false);
      if (songs.length > 1) {
        // Automatically skip to the next track if current node has issues
        setCurrentIndex((prev) => (prev + 1) % songs.length);
      } else {
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      if (songs.length > 1 && isShuffle) {
        let nextIdx;
        do {
          nextIdx = Math.floor(Math.random() * songs.length);
        } while (nextIdx === currentIndex && songs.length > 1);
        setCurrentTime(0);
        setCurrentIndex(nextIdx);
        setIsPlaying(true);
      } else if (songs.length > 0) {
        setCurrentTime(0);
        setCurrentIndex((prev) => (prev + 1) % songs.length);
        setIsPlaying(true);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [songs.length, currentIndex, isShuffle, isScrubbing, currentSong?.title, currentSong?.durationSec]);

  // Toggle Popup Card
  const handleToggleCard = () => {
    playTickSound();
    setIsOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen) {
        setIsAskingArtist(false);
      }
      return nextOpen;
    });
  };

  // Immediate toggle playback on single click
  const handleTogglePlayback = (e) => {
    e?.stopPropagation();
    playTickSound();

    if ((!songs || songs.length === 0) && !isLoading) {
      executeSearch(favArtist || "Trending");
      return;
    }

    setIsPlaying((prev) => !prev);
  };

  // Next Track with random shuffle support
  const handleNext = (e) => {
    e?.stopPropagation();
    playTickSound();
    if (songs.length > 1 && isShuffle) {
      let nextIdx;
      do {
        nextIdx = Math.floor(Math.random() * songs.length);
      } while (nextIdx === currentIndex && songs.length > 1);
      setCurrentTime(0);
      setCurrentIndex(nextIdx);
      setIsPlaying(true);
    } else if (songs.length > 0) {
      setCurrentTime(0);
      setCurrentIndex((prev) => (prev + 1) % songs.length);
      setIsPlaying(true);
    }
  };

  // Previous Track
  const handlePrev = (e) => {
    e?.stopPropagation();
    playTickSound();
    if (songs.length > 0) {
      setCurrentTime(0);
      setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
      setIsPlaying(true);
    }
  };

  // Execute search and save favorite artist in localStorage
  const executeSearch = async (searchTerm) => {
    const clean = (searchTerm || "").trim();
    if (!clean) return;

    playTickSound();
    setIsLoading(true);
    setActiveQuery(clean);
    setIsAskingArtist(false);

    // Save as favorite artist if user searched a specific artist/song
    if (clean.toLowerCase() !== "trending") {
      setFavArtist(clean);
      localStorage.setItem("music_fav_artist", clean);
    }
    localStorage.setItem("music_query", clean);

    try {
      const tracks =
        clean.toLowerCase() === "trending"
          ? await getTrendingTracks(25)
          : await searchTracks(clean, 25);

      if (tracks && tracks.length > 0) {
        setSongs(tracks);
        setCurrentIndex(0);
        setCurrentTime(0);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Music fetch error:", err);
    } finally {
      setIsLoading(false);
      setInputQuery("");
    }
  };

  // Scrubber Seeking Calculations (Click & Drag support)
  const calculateScrubSec = useCallback(
    (clientX) => {
      if (!scrubRef.current || !duration || !isFinite(duration)) return 0;
      const rect = scrubRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const handlePointerDownScrub = (e) => {
    e.stopPropagation();
    setIsScrubbing(true);
    const targetSec = calculateScrubSec(e.clientX);
    setCurrentTime(targetSec);
    if (audioRef.current && !isNaN(targetSec) && isFinite(targetSec)) {
      audioRef.current.currentTime = targetSec;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveScrub = (e) => {
    if (!isScrubbing) return;
    e.stopPropagation();
    const targetSec = calculateScrubSec(e.clientX);
    setCurrentTime(targetSec);
  };

  const handlePointerUpScrub = (e) => {
    if (!isScrubbing) return;
    e.stopPropagation();
    setIsScrubbing(false);
    const targetSec = calculateScrubSec(e.clientX);
    setCurrentTime(targetSec);
    if (audioRef.current && !isNaN(targetSec) && isFinite(targetSec)) {
      audioRef.current.currentTime = targetSec;
    }
  };

  // Broadcast open/search state to SearchButton
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("music-player-state", {
        detail: { isOpen, isAskingArtist },
      })
    );
  }, [isOpen, isAskingArtist]);

  // Listen to search button toggle from navbar
  useEffect(() => {
    const handleToggleSearch = () => {
      setIsOpen((prevOpen) => {
        if (!prevOpen) {
          setIsAskingArtist(true);
          return true;
        }
        if (isAskingArtist) {
          return false;
        } else {
          setIsAskingArtist(true);
          return true;
        }
      });
    };

    window.addEventListener("toggle-music-search", handleToggleSearch);
    return () => window.removeEventListener("toggle-music-search", handleToggleSearch);
  }, [isAskingArtist]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      const path = e.composedPath ? e.composedPath() : [];
      const isExternalActionClick =
        path.some(
          (el) =>
            el.classList &&
            (el.classList.contains("theme-toggle-wrapper") ||
              el.classList.contains("theme-toggle-btn") ||
              el.classList.contains("theme-tooltip") ||
              el.classList.contains("search-btn-wrapper") ||
              el.classList.contains("search-btn") ||
              el.classList.contains("search-btn-icon-img"))
        ) ||
        Boolean(e.target?.closest?.(".theme-toggle-wrapper")) ||
        Boolean(e.target?.closest?.(".theme-toggle-btn")) ||
        Boolean(e.target?.closest?.(".theme-tooltip")) ||
        Boolean(e.target?.closest?.(".search-btn-wrapper")) ||
        Boolean(e.target?.closest?.(".search-btn")) ||
        Boolean(e.target?.closest?.(".search-btn-icon-img"));

      if (isExternalActionClick) return;

      const isInside =
        path.some((el) => el === wrapperRef.current) ||
        Boolean(wrapperRef.current && wrapperRef.current.contains(e.target));

      if (!isInside) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format two-digit time mm:ss matching Apple macOS ("00:08", "-00:22")
  const formatTime2Digit = useCallback((secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return "00:00";
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins < 10 ? "0" : ""}${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  }, []);

  const progressPercent =
    duration && isFinite(duration) && duration > 0
      ? Math.max(0, Math.min(100, (currentTime / duration) * 100))
      : 0;
  const remainingSecs =
    duration && isFinite(duration) ? Math.max(0, duration - currentTime) : 0;

  return (
    <div className="play-btn-wrapper" ref={wrapperRef}>
      {/* Stable Native Audio Element */}
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" />

      {/* Top Navbar Play Button */}
      <button
        onClick={handleToggleCard}
        className={`play-btn ${isOpen ? "is-open" : ""} ${isPlaying ? "is-playing" : ""}`}
        aria-label="Now Playing"
        title={
          isPlaying && currentSong
            ? `Playing: ${currentSong.title} — ${currentSong.artist}`
            : favArtist
              ? `Music Player (Fav: ${favArtist})`
              : "Music Player"
        }
      >
        <div className={`play-circle-ring ${isPlaying ? "active-ring" : ""}`}>
          {isPlaying ? (
            <Pause size={10} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play
              size={10}
              fill="currentColor"
              strokeWidth={0}
              style={{ transform: "translateX(1px)" }}
            />
          )}
        </div>
        {isPlaying && <span className="playing-pulse-ring" />}
      </button>

      {/* Floating Apple macOS Control Center Liquid Frosted Glass Media Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.94, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: -8, scale: 0.94, x: "-50%" }}
            transition={{ type: "spring", stiffness: 460, damping: 32 }}
            className="apple-media-popup"
            onClick={(e) => e.stopPropagation()}
          >
            {isAskingArtist ? (
              /* --- Artist / Genre Selection Form inside Apple Glass Shell (LIKE BEFORE) --- */
              <div className="artist-prompt-box">
                <div className="artist-prompt-header">
                  <div className="prompt-header-icon-wrap">
                    <img
                      src="/searchMusic.png"
                      alt="Search Music"
                      className="prompt-header-icon-img"
                    />
                  </div>
                  <div>
                    <h5 className="artist-prompt-title">Personalize Music</h5>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeSearch(inputQuery);
                  }}
                  className="artist-prompt-form"
                >
                  <div className="artist-input-group">
                    <img
                      src="/search.png"
                      alt=""
                      aria-hidden="true"
                      className="artist-input-icon"
                    />
                    <input
                      type="text"
                      placeholder="Search artist or song..."
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      className="artist-input-field"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="artist-submit-btn"
                    disabled={!inputQuery.trim() || isLoading}
                  >
                    {isLoading ? <Loader2 size={11} className="spin-loader" /> : "Search"}
                  </button>
                  <button
                    type="button"
                    className="artist-cancel-btn"
                    onClick={() => setIsAskingArtist(false)}
                  >
                    Back
                  </button>
                </form>

                {/* Quick Selection Trending Artists (Single-line rectangular chips) */}
                <div className="artist-quick-section">
                  <div className="artist-quick-pills">
                    {favArtist && (
                      <button
                        type="button"
                        className="quick-pill"
                        disabled={isLoading}
                        onClick={() => executeSearch(favArtist)}
                        title={`Play favorite: ${favArtist}`}
                      >
                        {favArtist}
                      </button>
                    )}
                    <button
                      type="button"
                      className="quick-pill"
                      disabled={isLoading}
                      onClick={() => executeSearch("Trending")}
                      title="Play top trending tracks"
                    >
                      Trending
                    </button>
                    {TRENDING_ARTISTS.filter(
                      (artist) => artist.toLowerCase() !== favArtist?.toLowerCase()
                    ).map((artist) => (
                      <button
                        key={artist}
                        type="button"
                        className="quick-pill"
                        disabled={isLoading}
                        onClick={() => executeSearch(artist)}
                        title={`Play songs by ${artist}`}
                      >
                        {artist}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* --- Exact macOS Sonoma / Sequoia Control Center Media Card (LIKE BEFORE) --- */
              <div className="apple-media-layout">
                {/* Left: 1:1 Apple Squircle Artwork with Live Thumbnail */}
                <div
                  className="media-squircle-artwork"
                  title="Click to search favorite singer or song"
                  onClick={() => setIsAskingArtist(true)}
                >
                  {isLoading ? (
                    <div className="media-art-loading-shimmer">
                      <Loader2 size={22} className="spin-loader" />
                    </div>
                  ) : currentSong?.cover ? (
                    <img
                      key={currentSong.cover}
                      src={currentSong.cover}
                      alt={currentSong.title || "Album Art"}
                      className="media-cover-img"
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80";
                      }}
                    />
                  ) : (
                    <div className="media-cyan-art">
                      <Music size={24} style={{ opacity: 0.7 }} />
                    </div>
                  )}
                  <div className="media-artwork-specular" />
                </div>

                {/* Right: Title, Waveform, Artist, Controls, Scrubber */}
                <div className="media-right-column">
                  {/* Row 1: Title & Animated Waveform Indicator */}
                  <div className="media-title-row">
                    <h4 className="media-title" title={currentSong?.title || "No song selected"}>
                      {currentSong?.title || (isLoading ? "Connecting..." : "Music Player")}
                    </h4>

                    {/* Animated Waveform & Buffering indicator */}
                    {isBuffering && isPlaying ? (
                      <span className="media-buffering-badge" title="Buffering live audio stream">
                        Buffering...
                      </span>
                    ) : (
                      <div
                        className={`media-waveform-indicator ${isPlaying ? "is-playing" : ""}`}
                        title={isPlaying ? "Playing" : "Paused"}
                      >
                        <span className="wave-bar bar-1" />
                        <span className="wave-bar bar-2" />
                        <span className="wave-bar bar-3" />
                        <span className="wave-bar bar-4" />
                      </div>
                    )}
                  </div>

                  {/* Row 2: Subtitle / Artist */}
                  <div className="media-artist-row">
                    <span
                      className="media-artist"
                      title={currentSong?.artist ? `Artist: ${currentSong.artist}` : ""}
                    >
                      {currentSong?.artist || (favArtist ? `Fav: ${favArtist}` : "Trending")}
                    </span>
                  </div>

                  {/* Row 3: macOS Transport Glyphs (Rewind <<, Play/Pause, FastForward >>) */}
                  <div className="media-controls-row">
                    <button
                      type="button"
                      className="media-glyph-btn"
                      onClick={handlePrev}
                      aria-label="Previous track"
                      title="Previous"
                    >
                      <Rewind size={18} fill="currentColor" strokeWidth={0} />
                    </button>

                    <button
                      type="button"
                      className="media-glyph-btn media-glyph-play"
                      onClick={handleTogglePlayback}
                      aria-label={isPlaying ? "Pause" : "Play"}
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <Pause size={22} fill="currentColor" strokeWidth={0} />
                      ) : (
                        <Play
                          size={22}
                          fill="currentColor"
                          strokeWidth={0}
                          style={{ transform: "translateX(1px)" }}
                        />
                      )}
                    </button>

                    <button
                      type="button"
                      className="media-glyph-btn"
                      onClick={handleNext}
                      aria-label="Next track"
                      title="Next"
                    >
                      <FastForward size={18} fill="currentColor" strokeWidth={0} />
                    </button>
                  </div>

                  {/* Row 4: macOS Sleek Progress Scrub Bar & Timestamps */}
                  <div
                    ref={scrubRef}
                    className={`media-scrub-container ${isScrubbing ? "is-scrubbing" : ""}`}
                    onPointerDown={handlePointerDownScrub}
                    onPointerMove={handlePointerMoveScrub}
                    onPointerUp={handlePointerUpScrub}
                    title="Click or drag to seek"
                  >
                    <div className="media-scrub-track">
                      <div
                        className="media-scrub-fill"
                        style={{
                          width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                        }}
                      >
                        <span className="media-scrub-thumb" />
                      </div>
                    </div>

                    <div className="media-time-labels">
                      <span>{formatTime2Digit(currentTime)}</span>
                      <span>-{formatTime2Digit(remainingSecs)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
