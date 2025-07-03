/**
 * @file CustomVideoPlayer.tsx
 * @description This component provides a custom video player with controls for play/pause, volume, progress, and fullscreen.
 * It handles hydration issues by only rendering interactive elements after client-side mount.
 * @author AmitxD
 * @Copyright 2025
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";

/**
 * Props for the CustomVideoPlayer component.
 */
interface CustomVideoPlayerProps {
  /** The source URL of the video. */
  src: string;
  /** Optional alt text for the video. */
  alt?: string;
}

// Extend HTMLElement and Document for cross-browser fullscreen API support
interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}
interface FullscreenDocument extends Document {
  webkitExitFullscreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
}

/**
 * A custom video player component with comprehensive controls.
 * It includes play/pause, volume, progress, fullscreen, and download functionalities.
 * Handles hydration to ensure smooth client-side rendering.
 *
 * @param {CustomVideoPlayerProps} { src, alt } - The props for the component.
 * @returns {React.FC<CustomVideoPlayerProps>} A React functional component.
 */
const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ src, alt }) => {
  /** @type {React.RefObject<HTMLVideoElement>} Ref for the video element. */
  const videoRef = useRef<HTMLVideoElement>(null);
  /** @type {React.RefObject<HTMLDivElement>} Ref for the video player container. */
  const containerRef = useRef<HTMLDivElement>(null);
  /** @type {React.RefObject<HTMLDivElement>} Ref for the volume slider container. */
  const volumeSliderRef = useRef<HTMLDivElement>(null);
  
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to track if the component is mounted to prevent hydration issues. */
  const [isMounted, setIsMounted] = useState(false);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to track if the video is currently playing. */
  const [isPlaying, setIsPlaying] = useState(false);
  /** @type {[number, React.Dispatch<React.SetStateAction<number>>]} State to track the current playback progress in seconds. */
  const [progress, setProgress] = useState(0);
  /** @type {[number, React.Dispatch<React.SetStateAction<number>>]} State to track the total duration of the video in seconds. */
  const [duration, setDuration] = useState(0);
  /** @type {[number, React.Dispatch<React.SetStateAction<number>>]} State to track the current volume level (0 to 1). */
  const [volume, setVolume] = useState(1);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to track if the video is muted. */
  const [isMuted, setIsMuted] = useState(false);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to track if the video is in fullscreen mode. */
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to control the visibility of video controls. */
  const [showControls, setShowControls] = useState(true);
  /** @type {[NodeJS.Timeout | null, React.Dispatch<React.SetStateAction<NodeJS.Timeout | null>>]} Timeout ID for hiding controls. */
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to control the visibility of the volume slider. */
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  /** @type {React.RefObject<NodeJS.Timeout | null>} Ref for the volume slider hide timeout. */
  const volumeSliderTimeout = useRef<NodeJS.Timeout | null>(null);

  /**
   * Effect to set `isMounted` to true after the component mounts, addressing hydration issues.
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Triggers the display of video controls and sets a timeout to hide them if the video is playing.
   */
  const triggerShowControls = useCallback(() => {
    if (!isMounted) return;
    setShowControls(true);
    if (hideTimeout) clearTimeout(hideTimeout);
    if (isPlaying) {
      const timeout = setTimeout(() => setShowControls(false), 2500);
      setHideTimeout(timeout);
    }
  }, [isMounted, hideTimeout, isPlaying]);

  /**
   * Handles the play/pause functionality of the video.
   */
  const handlePlayPause = () => {
    if (!isMounted) return;
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(console.error); // Handle promise rejection
      setIsPlaying(true);
      triggerShowControls();
    } else {
      video.pause();
      setIsPlaying(false);
      setShowControls(true);
    }
  };

  /**
   * Updates the progress state as the video plays.
   */
  const handleTimeUpdate = () => {
    if (!isMounted) return;
    const video = videoRef.current;
    if (!video) return;
    setProgress(video.currentTime);
  };

  /**
   * Sets the video duration once metadata is loaded.
   */
  const handleLoadedMetadata = () => {
    if (!isMounted) return;
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  /**
   * Handles changes to the video progress via the progress bar.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the input element.
   */
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMounted) return;
    const video = videoRef.current;
    if (!video) return;
    const newTime = Number(e.target.value);
    video.currentTime = newTime;
    setProgress(newTime);
  };

  /**
   * Handles changes to the video volume via the volume slider.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the input element.
   */
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMounted) return;
    const video = videoRef.current;
    if (!video) return;
    const newVolume = Number(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  /**
   * Toggles the mute state of the video.
   * @param {React.MouseEvent} e - The mouse event from the button click.
   */
  const handleMuteToggle = (e: React.MouseEvent) => {
    if (!isMounted) return;
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
    if (!isMuted && video.volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }
    setShowVolumeSlider((prev) => !prev);
    if (!showVolumeSlider) {
      if (volumeSliderTimeout.current) clearTimeout(volumeSliderTimeout.current);
      volumeSliderTimeout.current = setTimeout(() => setShowVolumeSlider(false), 2500);
    }
  };

  /**
   * Effect to add and clean up a click listener for hiding the volume slider.
   * Runs only when `isMounted` and `showVolumeSlider` are true.
   */
  useEffect(() => {
    if (!isMounted || !showVolumeSlider) return;
    
    const handleClick = (e: MouseEvent) => {
      if (
        volumeSliderRef.current &&
        !volumeSliderRef.current.contains(e.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showVolumeSlider, isMounted]);

  /**
   * Toggles fullscreen mode for the video player container.
   */
  const handleFullscreen = () => {
    if (!isMounted) return;
    const container = containerRef.current as FullscreenElement | null;
    if (!container) return;
    const doc = document as FullscreenDocument;
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(console.error);
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen().catch?.(console.error);
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen().catch?.(console.error);
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(console.error);
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen().catch?.(console.error);
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen().catch?.(console.error);
      }
    }
  };

  /**
   * Effect to set up video volume/mute and fullscreen change listeners.
   * Runs only after the component is mounted.
   */
  useEffect(() => {
    if (!isMounted) return;
    
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
    
    const handleFsChange = () => {
      const doc = document as FullscreenDocument;
      const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
      setIsFullscreen(!!fsElement);
    };
    
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("msfullscreenchange", handleFsChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("msfullscreenchange", handleFsChange);
    };
  }, [volume, isMuted, isMounted]);

  /**
   * Effect to add and clean up mouse move/touch listeners for showing controls.
   * Runs only when `isMounted` and `isPlaying` are true.
   */
  useEffect(() => {
    if (!isMounted || !isPlaying) return;
    const handleMove = () => triggerShowControls();
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMove);
      container.addEventListener("touchstart", handleMove);
    }
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMove);
        container.removeEventListener("touchstart", handleMove);
      }
    };
  }, [isPlaying, hideTimeout, isMounted, triggerShowControls]);

  // Don't render interactive elements until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="w-full h-full rounded-xl bg-gray-900 border border-gray-700 shadow-lg flex flex-col items-center my-6 relative select-none">
        <div className="relative w-full h-full min-h-[180px] rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <video
            className="w-full h-full object-cover"
            style={{ cursor: "pointer", width: '100%', height: '100%' }}
          />
          {/* Static loading state */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-16 h-16 rounded-full bg-gray-900/80 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl bg-gray-900 border border-gray-700 shadow-lg flex flex-col items-center my-6 relative select-none"
      tabIndex={0}
      onMouseMove={isPlaying ? triggerShowControls : undefined}
      onClick={isPlaying ? triggerShowControls : undefined}
      style={{ padding: 0, width: '100%', height: '100%' }}
    >
      <div className="relative w-full h-full min-h-[180px] rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => { setIsPlaying(false); setShowControls(true); }}
          className="w-full h-full object-cover"
          tabIndex={-1}
          aria-label={alt || "Video"}
          onClick={handlePlayPause}
          style={{ cursor: "pointer", width: '100%', height: '100%' }}
        />
        
        {/* Center Play/Pause Button */}
        {(!isPlaying || showControls) && (
          <button
            onClick={handlePlayPause}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900/80 hover:bg-gray-800/90 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all shadow-xl z-20 flex items-center justify-center"
            aria-label={isPlaying ? "Pause video" : "Play video"}
            style={{ display: showControls || !isPlaying ? "flex" : "none", width: 64, height: 64, minWidth: 64, minHeight: 64 }}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
            )}
          </button>
        )}
        
        {/* Top Right: Fullscreen Button */}
        {showControls && (
          <button
            onClick={handleFullscreen}
            className="absolute top-3 right-3 bg-gray-800/80 hover:bg-gray-700/90 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all shadow-md z-20 flex items-center justify-center"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}
          >
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        )}
        
        {/* Bottom Controls */}
        {showControls && (
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-2 flex flex-col gap-2 z-10">
            {/* Controls Row */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="bg-transparent hover:bg-gray-800/60 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all shadow-none flex items-center justify-center"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                  style={{ width: 36, height: 36, minWidth: 36, minHeight: 36 }}
                >
                  {isPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                      <path d="M8 5v14l11-7z" fill="currentColor"/>
                    </svg>
                  )}
                </button>
                <span className="text-sm text-gray-200 min-w-[80px] text-left font-mono">
                  {formatTime(progress)} / {formatTime(duration)}
                </span>
              </div>
              <div className="flex items-center gap-2 relative">
                {/* Volume */}
                <div className="flex items-center gap-1 relative">
                  <button
                    onClick={handleMuteToggle}
                    className="bg-gray-800/80 hover:bg-gray-700/90 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all shadow-md flex items-center justify-center"
                    aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                    style={{ width: 36, height: 36, minWidth: 36, minHeight: 36 }}
                  >
                    {isMuted || volume === 0 ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
                        <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2"/>
                        <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/>
                      </svg>
                    )}
                  </button>
                  {showVolumeSlider && (
                    <div ref={volumeSliderRef} className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center bg-gray-800/90 rounded-md px-3 py-2 shadow-lg z-30" style={{ minWidth: 100 }} onClick={e => e.stopPropagation()}>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 accent-purple-500 h-1"
                        style={{ touchAction: 'none' }}
                      />
                    </div>
                  )}
                </div>
                {/* Download */}
                <a
                  href={src}
                  download
                  className="bg-gray-800/80 hover:bg-gray-700/90 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all shadow-md flex items-center justify-center"
                  aria-label="Download video"
                  style={{ width: 36, height: 36, minWidth: 36, minHeight: 36 }}
                  tabIndex={0}
                >
                  <Download size={18} className="flex-shrink-0" />
                </a>
              </div>
            </div>
            {/* Progress Bar Row */}
            <div className="flex items-center gap-2 w-full">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={progress}
                onChange={handleProgressChange}
                className="flex-1 accent-purple-500 h-1"
                style={{ minWidth: 0 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Formats a time in seconds into a human-readable string (MM:SS).
 * @param {number} time - The time in seconds.
 * @returns {string} The formatted time string.
 */
function formatTime(time: number) {
  if (!isFinite(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default CustomVideoPlayer;
