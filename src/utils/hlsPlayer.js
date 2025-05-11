// Custom HLS player implementation that handles HTTP headers for IPTV streams
import Hls from 'hls.js';

/**
 * Initialize an HLS player with custom HTTP headers
 * @param {HTMLVideoElement} videoElement - The video element to attach to
 * @param {string} streamUrl - The HLS stream URL
 * @param {Object} headers - HTTP headers to add to requests
 * @returns {Hls|null} - The Hls instance or null if not supported
 */
export function initHlsPlayer(videoElement, streamUrl, headers = {}) {
  // Verify we have what we need
  if (!videoElement || !streamUrl) {
    console.error('Missing required parameters for HLS player');
    return null;
  }
  
  // Check if the browser has native HLS support
  const hasNativeHls = videoElement.canPlayType('application/vnd.apple.mpegurl');
  
  // If Hls.js is not supported and there's no native support, we can't play HLS
  if (!Hls.isSupported() && !hasNativeHls) {
    console.error('HLS is not supported in this browser');
    return null;
  }
  
  // Clean up any existing Hls instance attached to this element
  if (videoElement.hlsPlayer) {
    videoElement.hlsPlayer.destroy();
    videoElement.hlsPlayer = null;
  }
  
  // Use Hls.js if supported
  if (Hls.isSupported()) {
    // Create configuration with headers
    const config = {
      // Optimize for playback speed
      startLevel: -1, // Auto-select quality
      debug: false, // Disable debug logs
      maxBufferLength: 30, // Increase buffer for smoother playback
      maxMaxBufferLength: 60,
      
      xhrSetup: function(xhr, url) {
        // Apply all custom headers
        Object.keys(headers).forEach(header => {
          if (headers[header]) {
            xhr.setRequestHeader(header, headers[header]);
          }
        });
        
        // Set some general useful headers
        xhr.setRequestHeader('Accept', '*/*');
        xhr.withCredentials = false; // Avoid sending cookies with CORS requests
      }
    };
      // Create Hls instance with our config
    const hls = new Hls(config);
    
    // Attach to video element
    hls.attachMedia(videoElement);
    
    // Add event listeners
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(streamUrl);
    });
    
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      // Try to play immediately when ready
      videoElement.play().catch(e => {
        // Only show errors for non-autoplay issues
        if (!e.message.includes('play() failed because the user')) {
          console.warn('Playback issue:', e);
        }
      });
    });
    
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // Try to recover from network errors
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            break;
        }
      }
    });
    
    // Store reference for cleanup
    videoElement.hlsPlayer = hls;
    
    return hls;
  }
  // Use native HLS support (Safari, iOS)
  else if (hasNativeHls) {
    console.log('Using native HLS support');
    videoElement.src = streamUrl;
    return null;
  }
}

/**
 * Destroy an HLS player instance
 * @param {HTMLVideoElement} videoElement - The video element with attached HLS player
 */
export function destroyHlsPlayer(videoElement) {
  if (videoElement && videoElement.hlsPlayer) {
    videoElement.hlsPlayer.destroy();
    videoElement.hlsPlayer = null;
  }
}
