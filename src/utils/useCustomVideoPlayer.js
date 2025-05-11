import { useEffect, useRef } from 'react';
import { initHlsPlayer, destroyHlsPlayer } from './hlsPlayer';

/**
 * Custom hook to manage video playback with HLS support and HTTP headers
 * @param {Object} options - Configuration options
 * @param {string} options.url - Stream URL
 * @param {Object} options.headers - HTTP headers to add to requests
 * @param {Function} options.onError - Error callback
 * @param {Function} options.onReady - Ready callback
 * @param {boolean} options.autoplay - Whether to autoplay when ready
 * @returns {Object} - Video ref and control functions
 */
export function useCustomVideoPlayer(options = {}) {
  const { url, headers = {}, onError, onReady, autoplay = false } = options;
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  
  // Initialize video player
  useEffect(() => {
    if (!url) return;
    
    console.log('Setting up custom video player with URL:', url);
    
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    try {
      // Create player with headers
      playerRef.current = initHlsPlayer(videoElement, url, headers);
      
      // Setup event handlers
      const handleError = (e) => {
        console.error('Video playback error:', e);
        if (onError) onError(`Failed to play video: ${e.message || 'Unknown error'}`);
      };
      
      const handleCanPlay = () => {
        console.log('Video can play');
        if (onReady) onReady();
        
        // Try autoplay if requested
        if (autoplay) {
          videoElement.play().catch((e) => {
            console.warn('Autoplay prevented by browser:', e);
          });
        }
      };
      
      // Add event listeners to video element
      videoElement.addEventListener('error', handleError);
      videoElement.addEventListener('canplay', handleCanPlay);
      
      // Cleanup function
      return () => {
        videoElement.removeEventListener('error', handleError);
        videoElement.removeEventListener('canplay', handleCanPlay);
        destroyHlsPlayer(videoElement);
      };
    } catch (error) {
      console.error('Error initializing video player:', error);
      if (onError) onError(`Failed to initialize player: ${error.message}`);
    }
  }, [url, headers, onError, onReady, autoplay]);
  
  // Control methods
  const play = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((e) => {
        console.warn('Play failed:', e);
      });
    }
  };
  
  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };
  
  const setVolume = (volume) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  };
  
  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };
  
  return {
    videoRef,
    playerRef,
    controls: {
      play,
      pause,
      setVolume,
      seekTo
    }
  };
}
