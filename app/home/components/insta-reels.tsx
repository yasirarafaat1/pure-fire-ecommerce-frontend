"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCachedJson } from "../../utils/cachedFetch";
import { defaultPublicSettings, fetchPublicSettings } from "../../utils/public-settings";
import { IoIosClose } from "react-icons/io";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import {
  FaInstagram,
  FaPause,
  FaPlay,
  FaVolumeHigh,
  FaVolumeXmark,
} from "react-icons/fa6";

type RawReel = {
  id?: string | number;
  _id?: string | number;
  reel_id?: string | number;
  instagramMediaId?: string | number;
  title?: string;
  caption?: string;
  description?: string;
  text?: string;
  videoUrl?: string;
  video_url?: string;
  mediaUrl?: string;
  media_url?: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  coverUrl?: string;
  cover_url?: string;
  permalink?: string;
  timestamp?: string;
  date?: string;
  createdAt?: string;
  username?: string;
};

type Reel = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  permalink?: string;
  date: string;
  username?: string;
};

const REELS_ENDPOINT = "/api/user/instagram/reels?limit=20";
const MOCK_REELS: Reel[] = Array.from({ length: 10 }, (_, index) => {
  const titles = [
    "New Drop Preview",
    "Street Style Fit",
    "Weekend Outfit",
    "Cotton Edit",
    "Minimal Layers",
    "Everyday Look",
    "Try-on Moment",
    "Color Story",
    "Product Detail",
    "Pure Fire Pick",
  ];

  return {
    id: `mock-reel-${index + 1}`,
    title: titles[index] || `Pure Fire Reel ${index + 1}`,
    description: "Mock reel preview for storefront testing.",
    videoUrl:
      index % 2 === 0
        ? "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        : "https://media.w3.org/2010/05/sintel/trailer.mp4",
    thumbnailUrl: "",
    permalink: "",
    date: "",
    username: "purefire",
  };
});

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeReel(raw: RawReel, index: number): Reel | null {
  const videoUrl =
    getString(raw.videoUrl) ||
    getString(raw.video_url) ||
    getString(raw.mediaUrl) ||
    getString(raw.media_url);

  if (!videoUrl) return null;

  const title =
    getString(raw.title) ||
    getString(raw.caption).split("\n")[0]?.trim() ||
    `Instagram Reel ${index + 1}`;

  const description =
    getString(raw.description) ||
    getString(raw.caption) ||
    getString(raw.text) ||
    "Watch our latest Instagram reel.";

  return {
    id: String(
      raw.id || raw._id || raw.reel_id || raw.instagramMediaId || `reel-${index}`,
    ),
    title,
    description,
    videoUrl,
    thumbnailUrl:
      getString(raw.thumbnailUrl) ||
      getString(raw.thumbnail_url) ||
      getString(raw.coverUrl) ||
      getString(raw.cover_url),
    permalink: getString(raw.permalink),
    username: getString(raw.username),
    date:
      getString(raw.date) ||
      formatDate(raw.timestamp || raw.createdAt) ||
      "",
  };
}

function extractReels(payload: unknown): RawReel[] {
  if (Array.isArray(payload)) return payload as RawReel[];
  if (!payload || typeof payload !== "object") return [];
  const cacheEntry = payload as { data?: unknown; status?: number };
  if (cacheEntry.status !== undefined && cacheEntry.data) {
    return extractReels(cacheEntry.data);
  }
  const data = payload as { reels?: RawReel[]; data?: RawReel[] | { reels?: RawReel[] } };
  if (Array.isArray(data.reels)) return data.reels;
  if (data.data && !Array.isArray(data.data) && Array.isArray(data.data.reels)) return data.data.reels;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function extractHandle(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const cacheEntry = payload as { data?: unknown; status?: number };
  if (cacheEntry.status !== undefined && cacheEntry.data) {
    return extractHandle(cacheEntry.data);
  }
  const data = payload as { handle?: string; data?: { handle?: string } };
  return getString(data.handle) || getString(data.data?.handle);
}

function extractEnabled(payload: unknown) {
  if (!payload || typeof payload !== "object") return true;
  const cacheEntry = payload as { data?: unknown; status?: number };
  if (cacheEntry.status !== undefined && cacheEntry.data) {
    return extractEnabled(cacheEntry.data);
  }
  const data = payload as { enabled?: boolean; data?: { enabled?: boolean } };
  if (typeof data.enabled === "boolean") return data.enabled;
  if (typeof data.data?.enabled === "boolean") return data.data.enabled;
  return true;
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function trimText(text: string, max = 92) {
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

async function fetchFreshReels() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  try {
    return await fetch(REELS_ENDPOINT, {
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function InstagramReelsMarquee() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [handle, setHandle] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const seededRef = useRef(false);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!seededRef.current) setLoading(true);

      try {
        const cached = getCachedJson(REELS_ENDPOINT);
        const cachedReels = extractReels(cached)
          .map(normalizeReel)
          .filter((reel): reel is Reel => Boolean(reel));
        const cachedHandle = extractHandle(cached);
        const fallbackHandle =
          defaultPublicSettings.instagramReels?.handle ||
          defaultPublicSettings.storeName ||
          "Instagram";

        if (cached) {
          setEnabled(extractEnabled(cached));
          if (cachedHandle) setHandle(cachedHandle);
        }

        if (cachedReels.length) {
          setHandle(cachedHandle || fallbackHandle);
          setReels(cachedReels);
          setLoading(false);
          seededRef.current = true;
        }

        const [publicSettings, res] = await Promise.all([
          fetchPublicSettings().catch(() => defaultPublicSettings),
          fetchFreshReels(),
        ]);
        const settingsHandle =
          publicSettings.instagramReels?.handle ||
          publicSettings.storeName ||
          fallbackHandle;
        setHandle(settingsHandle);

        if (!res.ok) {
          console.error("Instagram reels API failed:", res.status, REELS_ENDPOINT);
          if (!seededRef.current) {
            setEnabled(true);
            setHandle(settingsHandle);
            setReels(MOCK_REELS);
            seededRef.current = true;
          }
          return;
        }

        const data = await res.json();
        const responseEnabled = extractEnabled(data);
        setEnabled(responseEnabled);
        setHandle(extractHandle(data) || settingsHandle);

        if (!responseEnabled) {
          setEnabled(false);
          if (!seededRef.current) setReels([]);
          return;
        }

        const freshReels = extractReels(data)
          .map(normalizeReel)
          .filter((reel): reel is Reel => Boolean(reel));

        setReels(freshReels);
        seededRef.current = freshReels.length > 0;
      } catch (error) {
        console.error("Instagram reels load error:", error);
        if (!seededRef.current) {
          setEnabled(true);
          setHandle(
            defaultPublicSettings.instagramReels?.handle ||
              defaultPublicSettings.storeName ||
              "purefire",
          );
          setReels(MOCK_REELS);
          seededRef.current = true;
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (openIdx === null) return;

    setIsMuted(true);
    setIsPlaying(true);

    const video = modalVideoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = true;

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        setIsPlaying(false);
      });
    }
  }, [openIdx]);

  const marqueeItems = useMemo(() => {
    if (!reels.length) return [];

    const repeatedHalf = Array.from({ length: 2 }).flatMap(() => reels);
    return [...repeatedHalf, ...repeatedHalf];
  }, [reels]);

  const selectedReel = openIdx !== null ? reels[openIdx] : null;

  const go = (dir: 1 | -1) => {
    if (openIdx === null || !reels.length) return;
    setOpenIdx((openIdx + dir + reels.length) % reels.length);
  };

  const togglePlay = async () => {
    const video = modalVideoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = modalVideoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const closeModal = () => {
    const video = modalVideoRef.current;
    if (video) video.pause();

    setOpenIdx(null);
    setIsMuted(true);
    setIsPlaying(true);
  };

  const hasReal = reels.length > 0;
  const displayHandle = (handle || selectedReel?.username || "Instagram").replace(/^@+/, "");

  if (!loading && (!enabled || !hasReal)) return null;

  return (
    <section className="min-h-[440px] md:py-5 overflow-hidden md:min-h-[470px]">
      <div className="max-w-6xl mx-auto px-4 md:px-2 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold border-b border-gray-600 inline-flex items-center gap-2">
              <FaInstagram className="text-black" />
              @{displayHandle}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-2">
              Latest looks, styling ideas, and product moments.
            </p>
          </div>
        </div>
      </div>

      {loading && !hasReal ? (
        <div className="reels-marquee-wrap">
          <div className="reels-marquee-track">
            {Array.from({ length: 10 }).map((_, item) => (
              <div key={item} className="reel-card reel-card-skeleton">
                <div className="absolute left-3 right-3 bottom-3">
                  <div className="h-3 w-24 rounded-[3px] bg-white/50 animate-pulse" />
                  <div className="mt-2 h-2.5 w-full rounded-[3px] bg-white/35 animate-pulse" />
                  <div className="mt-2 h-2.5 w-4/5 rounded-[3px] bg-white/35 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="reels-marquee-wrap">
          <div className="reels-marquee-track">
            {marqueeItems.map((reel, index) => {
              const originalIndex = reels.findIndex((item) => item.id === reel.id);

              return (
                <button
                  key={`${reel.id}-${index}`}
                  type="button"
                  className="reel-card"
                  onClick={() => setOpenIdx(originalIndex >= 0 ? originalIndex : 0)}
                  aria-label={`Open ${reel.title}`}
                >
                  {reel.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="reel-card-preview grid h-full w-full place-items-center bg-[linear-gradient(145deg,#111827,#020617)] text-white">
                      <FaPlay className="text-2xl opacity-90" />
                    </div>
                  )}

                  <div className="reel-card-gradient" />

                  <div className="absolute left-3 right-3 bottom-3 text-left text-white">
                    <p className="text-sm font-semibold reel-title-clamp">
                      {reel.title}
                    </p>
                    <p className="text-xs leading-5 text-white/85 mt-1 reel-desc-clamp">
                      {trimText(reel.description)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedReel && openIdx !== null && (
        <div className="reel-modal-root fixed inset-0 z-50 bg-white animate-backdrop">
          <button
            type="button"
            className="reel-modal-close"
            onClick={closeModal}
            aria-label="Close reel"
          >
            <IoIosClose size={28} />
          </button>

          {reels.length > 1 ? (
            <>
              <button
                type="button"
                className="reel-modal-nav reel-modal-nav-left"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Previous reel"
              >
                <IoChevronBack size={22} />
              </button>

              <button
                type="button"
                className="reel-modal-nav reel-modal-nav-right"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Next reel"
              >
                <IoChevronForward size={22} />
              </button>
            </>
          ) : null}

          <div className="reel-modal-content">
            <div className="reel-modal-video-shell">
              <video
                key={selectedReel.id}
                ref={modalVideoRef}
                src={selectedReel.videoUrl}
                poster={selectedReel.thumbnailUrl}
                muted={isMuted}
                loop
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              <div className="reel-video-top-fade" />
              <div className="reel-video-bottom-fade" />

              <div className="reel-control-row">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="reel-control-button"
                  aria-label={isPlaying ? "Pause reel" : "Play reel"}
                >
                  {isPlaying ? <FaPause size={15} /> : <FaPlay size={15} className="ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="reel-control-button"
                  aria-label={isMuted ? "Unmute reel" : "Mute reel"}
                >
                  {isMuted ? <FaVolumeXmark size={17} /> : <FaVolumeHigh size={17} />}
                </button>
              </div>

              <div className="reel-scroll-hint">
                <span>Scroll for details</span>
              </div>
            </div>

            <div className="reel-modal-info">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] uppercase text-[var(--muted)]">
                <FaInstagram className="text-black" />
                Instagram Reel
              </div>

              <h3 className="text-2xl md:text-2xl font-semibold mt-4 text-black modal-title-clamp">
                {selectedReel.title}
              </h3>

              <p className="text-sm md:text-sm leading-7 text-[var(--ink)] mt-4 modal-desc-clamp">
                {selectedReel.description}
              </p>

              <div className="mt-6 pt-5 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[var(--muted)]">
                  {selectedReel.date || "Recently added"}
                </p>

                {selectedReel.permalink ? (
                  <a
                    href={selectedReel.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold border border-black rounded-[5px] px-3 py-2 hover:bg-black hover:text-white transition"
                  >
                    View on Instagram
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .reels-marquee-wrap {
          width: 100%;
          overflow: hidden;
          padding-bottom: 4px;
        }

        .reels-marquee-track {
          display: flex;
          width: max-content;
          gap: 14px;
          animation: reels-marquee-left 72s linear infinite;
          will-change: transform;
        }

        .reels-marquee-wrap:hover .reels-marquee-track {
          animation-play-state: paused;
        }

        .reel-card {
          position: relative;
          width: 210px;
          aspect-ratio: 9 / 16;
          overflow: hidden;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.12);
          flex-shrink: 0;
          cursor: pointer;
        }

        .reel-card-skeleton {
          cursor: default;
          background:
            linear-gradient(180deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.28)),
            rgba(0, 0, 0, 0.06);
        }

        .reel-card-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0) 38%,
            rgba(0, 0, 0, 0.68) 100%
          );
          pointer-events: none;
        }

        .reel-title-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .reel-desc-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .modal-title-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .modal-desc-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 7;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .reel-modal-root {
          overflow-y: auto;
          overscroll-behavior: contain;
        }

        .reel-modal-content {
          width: 100%;
          min-height: 100svh;
        }

        .reel-modal-video-shell {
          position: relative;
          width: 100%;
          height: 100svh;
          overflow: hidden;
          background: #000;
        }

        .reel-modal-info {
          background: #ffffff;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          padding: 26px 20px 34px;
          min-height: 48svh;
        }

        .reel-modal-close,
        .reel-modal-nav,
        .reel-control-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.34);
          background: rgba(255, 255, 255, 0.82);
          color: #000;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          cursor: pointer;
          transition:
            transform 180ms ease,
            background 220ms ease,
            box-shadow 220ms ease;
        }

        .reel-modal-close:hover,
        .reel-modal-nav:hover,
        .reel-control-button:hover {
          background: #ffffff;
          transform: scale(1.04);
          box-shadow: 0 16px 42px rgba(0, 0, 0, 0.26);
        }

        .reel-modal-close {
          position: fixed;
          top: max(12px, env(safe-area-inset-top));
          right: 12px;
          z-index: 70;
          width: 44px;
          height: 44px;
        }

        .reel-modal-nav {
          position: fixed;
          z-index: 65;
          width: 42px;
          height: 42px;
          top: 50svh;
        }

        .reel-modal-nav-left {
          left: 12px;
        }

        .reel-modal-nav-right {
          right: 12px;
        }

        .reel-control-row {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: max(18px, env(safe-area-inset-bottom));
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .reel-control-button {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.9);
        }

        .reel-video-top-fade {
          position: absolute;
          inset: 0 0 auto;
          height: 120px;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.42), transparent);
        }

        .reel-video-bottom-fade {
          position: absolute;
          inset: auto 0 0;
          height: 180px;
          pointer-events: none;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.58), transparent);
        }

        .reel-scroll-hint {
          position: absolute;
          left: 50%;
          bottom: max(22px, env(safe-area-inset-bottom));
          z-index: 18;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .reel-scroll-hint span {
          display: none;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.82);
          padding: 7px 12px;
          font-size: 10px;
          font-weight: 700;
          color: rgba(0, 0, 0, 0.72);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        @keyframes reels-marquee-left {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        @media (min-width: 768px) {
          .reel-modal-root {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }

          .reel-modal-content {
            max-width: 1024px;
            min-height: auto;
            display: grid;
            grid-template-columns: 0.72fr 0.9fr;
            gap: 28px;
            align-items: stretch;
          }

          .reel-modal-video-shell {
            aspect-ratio: 9 / 16;
            height: auto;
            max-height: 82vh;
            max-width: 390px;
            border-radius: 8px;
            margin-inline: auto;
          }

          .reel-modal-info {
            min-height: 260px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 24px;
            display: flex;
            flex-direction: column;
          }

          .reel-modal-close {
            top: 24px;
            right: 24px;
          }

          .reel-modal-nav {
            top: 50%;
          }

          .reel-modal-nav-left {
            left: 24px;
          }

          .reel-modal-nav-right {
            right: 24px;
          }

          .reel-scroll-hint {
            display: none;
          }
        }

       @media (max-width: 767px) {
  .reels-marquee-track {
    gap: 12px;
    animation-duration: 46s;
  }

  .reel-card {
    width: 168px;
  }

  .reel-modal-video-shell {
    border-radius: 0;
  }

  .reel-modal-nav {
    display: none;
  }

  .modal-desc-clamp {
    -webkit-line-clamp: 8;
  }
}

        @media (max-width: 380px) {
          .reel-modal-close,
          .reel-modal-nav,
          .reel-control-button {
            width: 40px;
            height: 40px;
          }

          .reel-modal-nav-left {
            left: 9px;
          }

          .reel-modal-nav-right {
            right: 9px;
          }

          .reel-control-row {
            left: 14px;
            right: 14px;
          }

          .reel-modal-info {
            padding: 24px 18px 32px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reels-marquee-track {
            animation: none;
            width: auto;
            overflow-x: auto;
          }

          .reel-modal-close,
          .reel-modal-nav,
          .reel-control-button {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
