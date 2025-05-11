import React, { useState, useEffect } from 'react';
import { useCustomVideoPlayer } from '../utils/useCustomVideoPlayer';
import './VideoPlayer.css';

/**
 * A direct video player component that uses HLS.js for better header support
 */
const DirectVideoPlayer = ({ media, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
    // Extract headers from media item and set them at Electron level
  const getHeaders = () => {
    const headers = {};
    
    if (media && media.attributes) {
      if (media.attributes['http-referrer']) {
        headers['Referer'] = media.attributes['http-referrer'];
      }
      if (media.attributes['http-user-agent']) {
        headers['User-Agent'] = media.attributes['http-user-agent'];
      }
      
      // Look for EXTVLCOPT headers too
      Object.keys(media.attributes).forEach(key => {
        if (key.startsWith('EXTVLCOPT:http-')) {
          const headerName = key.replace('EXTVLCOPT:http-', '');
          headers[headerName] = media.attributes[key];
        }
      });
    }
    
    // Use a default user agent as fallback
    if (!headers['User-Agent']) {
      headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    }
    
    // If we have electron API access, set these headers for this specific stream URL
    if (window.electron && media?.url) {
      try {
        window.electron.setStreamHeaders(media.url, headers);
        console.log('Set stream headers via Electron API:', media.url, headers);
      } catch (err) {
        console.error('Failed to set stream headers:', err);
      }
    }
    
    return headers;
  };
    // Setup custom player hook
  const { videoRef, controls } = useCustomVideoPlayer({
    url: media?.url,
    headers: getHeaders(),
    onError: (message) => {
      setIsLoading(false);
      if (onError) onError(message);
    },
    onReady: () => {
      setIsLoading(false);
      console.log('Video ready to play');
      // Auto-play when stream is ready to reduce user friction
      controls.play();
      setIsPlaying(true);
    },
    autoplay: true // Enable autoplay to start stream immediately
  });
  
  // Handle media changes
  useEffect(() => {
    if (media?.url) {
      setIsLoading(true);
      setIsPlaying(false);
      console.log('New media selected with headers:', getHeaders());
    }
  }, [media]);
  
  // Control handlers
  const handlePlay = () => {
    controls.play();
    setIsPlaying(true);
  };
  
  const handlePause = () => {
    controls.pause();
    setIsPlaying(false);
  };
  
  const togglePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };
  
  return (
    <div className="video-player-container">
      {media ? (
        <div className="direct-player-wrapper">
          {/* Video Element */}
          <video
            ref={videoRef}
            className="direct-video-element"
            onClick={togglePlayPause}
            controls={showControls}
            controlsList="nodownload"
            poster={media.tvg?.logo || ''}
          />
          
          {/* Title Overlay */}
          <div className="video-title-overlay">{media?.name || 'Unknown Channel'}</div>
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="video-loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading stream...</p>
            </div>
          )}
          
          {/* Custom Controls (when native controls are hidden) */}
          {!showControls && (
            <div className="custom-controls">
              <button className="play-pause-button" onClick={togglePlayPause}>
                {isPlaying ? '⏸️' : '▶️'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="no-media-selected">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
              <polyline points="17 2 12 7 7 2"></polyline>
            </svg>
            <p>Select a channel from the playlist to start watching</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectVideoPlayer;
