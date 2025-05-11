import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';
import './VideoPlayer.css';
import './videojs-overrides.css';
import { createHeadersMiddleware, setupElectronHeaderHandling } from '../utils/videoMiddleware';

const VideoPlayer = ({ media, onError }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debug: Log when media prop changes
  useEffect(() => {
    if (media) {
      console.log('[VideoPlayer] Media changed:', {
        name: media.name,
        url: media.url,
        attributes: media.attributes
      });
    }
  }, [media]);useEffect(() => {
    // Initialize video.js
    if (!playerRef.current) {
      const videoElement = videoRef.current;
      if (!videoElement) return;
        const options = {
        responsive: true,
        fluid: true,
        controls: true,
        autoplay: false,
        preload: 'auto',
        liveui: true,
        userActions: {
          hotkeys: true,
          doubleClick: true
        },
        controlBar: {
          playToggle: { order: 1 },
          volumePanel: { inline: false, order: 2 },
          currentTimeDisplay: true,
          timeDivider: true,
          durationDisplay: true,
          progressControl: true,
          fullscreenToggle: { order: 10 }
        },
        html5: {
          vhs: {
            overrideNative: true,
            withCredentials: false,
            enableLowInitialPlaylist: true,
            limitRenditionByPlayerDimensions: true,
            handleManifestRedirects: true
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false
        },
        sources: [] // Start with empty sources
      };
        playerRef.current = videojs(videoElement, options);
      
      // Force controls to be visible
      playerRef.current.controls(true);
      
      // Register HTTP headers middleware
      const headersMiddleware = createHeadersMiddleware();
      videojs.use('*', headersMiddleware);
      
      console.log('HTTP Headers middleware registered');
      
      // Add a custom method to force controls visibility
      playerRef.current.forceControlsVisible = () => {
        const controlBar = document.querySelector('.vjs-control-bar');
        const bigPlayButton = document.querySelector('.vjs-big-play-button');
        
        if (controlBar) {
          controlBar.style.display = 'flex';
          controlBar.style.visibility = 'visible';
          controlBar.style.opacity = '1';
        }
        
        if (bigPlayButton) {
          bigPlayButton.style.display = 'block';
          bigPlayButton.style.visibility = 'visible';
          bigPlayButton.style.opacity = '1';
        }
        
        // Also make individual controls visible
        document.querySelectorAll('.vjs-control').forEach(control => {
          control.style.visibility = 'visible';
          control.style.opacity = '1';
        });
      };
      
      console.log('Video.js player initialized with options:', options);
    }

    return () => {
      // Dispose player on component unmount
      if (playerRef.current) {
        console.log('Disposing video.js player');
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);  // Update player source when media changes
  useEffect(() => {
    if (playerRef.current && media) {
      setIsLoading(true);
      
      // Set up error handling
      const handleError = (e) => {
        console.error('Video playback error:', e);
        setIsLoading(false);
        if (onError) {
          onError(`Failed to play: ${media.name}. The stream may be unavailable or geo-blocked.`);
        }
      };
      
      // Set up event handlers
      const handleCanPlay = () => {
        console.log('Video can play now');
        playerRef.current.play().catch(err => {
          console.warn('Autoplay prevented:', err);
          // Allow user to click play button
        });
      };
      
      const handleLoadedData = () => {
        setIsLoading(false);
        console.log('Video data loaded successfully');
      };
      
      // Add event listeners
      playerRef.current.on('error', handleError);
      playerRef.current.on('canplay', handleCanPlay);
      playerRef.current.on('loadeddata', handleLoadedData);
      
      // Extract referrer and user agent from media if available
      let httpReferrer = null;
      let userAgent = null;
      
      // Check if we have a full URL with potential EXTINF data
      if (media.url && media.attributes) {
        if (media.attributes['http-referrer']) {
          httpReferrer = media.attributes['http-referrer'];
        }
        if (media.attributes['http-user-agent']) {
          userAgent = media.attributes['http-user-agent'];
        }
      }
      
      // Update the source with appropriate headers if available
      const sourceOptions = {
        src: media.url,
        type: media.type || 'application/x-mpegURL'
      };
        // Add headers if available
      if (httpReferrer || userAgent) {
        sourceOptions.headers = {};
        if (httpReferrer) sourceOptions.headers.Referer = httpReferrer;
        if (userAgent) sourceOptions.headers['User-Agent'] = userAgent;
        
        // Also set up Electron-specific headers
        setupElectronHeaderHandling(media);
        
        console.log('Added HTTP headers for stream:', { 
          referrer: httpReferrer, 
          userAgent: userAgent 
        });
      }
        // Make sure we're ready to change the source
      if (playerRef.current.tech(true)) {
        // Pause any current playback
        playerRef.current.pause();
        
        // Reset the player 
        playerRef.current.reset();
        
        console.log('Setting source:', sourceOptions);
        
        // Ensure controls are visible before setting the source
        playerRef.current.controls(true);
        
        // Set the new source
        playerRef.current.src(sourceOptions);
        
        // Set poster if available
        if (media.tvg && media.tvg.logo) {
          playerRef.current.poster(media.tvg.logo);
        } else {
          // Default poster when none is provided
          playerRef.current.poster('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIHZpZXdCb3g9IjAgMCAxNjAgOTAiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IndoaXRlIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==');
        }
        
        // Set title
        const titleOverlay = document.querySelector('.video-title-overlay');
        if (titleOverlay) {
          titleOverlay.textContent = media.name || 'Unknown Channel';
        }
          // Load the video and attempt to play when ready
        playerRef.current.load();
        
        // Create a wrapper for the play function that handles errors
        const attemptToPlay = () => {
          console.log('Attempting to play:', media.url);
          
          // Ensure controls are visible
          playerRef.current.controls(true);
          
          // Try to play the video
          playerRef.current.play()
            .then(() => {
              console.log('Playback started successfully');
              setIsLoading(false);
            })
            .catch(e => {
              console.warn('Playback failed to start automatically:', e);
              setIsLoading(false);
              
              // Don't show error on autoplay failure - this is expected due to browser policies
              // Just ensure the play button is visible
              const bigPlayBtn = document.querySelector('.vjs-big-play-button');
              if (bigPlayBtn) {
                bigPlayBtn.style.display = 'block';
                bigPlayBtn.style.opacity = '1';
                bigPlayBtn.style.visibility = 'visible';
                
                // Add a click handler directly to the play button
                bigPlayBtn.onclick = () => {
                  playerRef.current.play().catch(err => {
                    console.error('Play failed after button click:', err);
                    if (onError) {
                      onError(`Failed to play: ${media.name}. The stream may be unavailable or geo-blocked.`);
                    }
                  });
                };
              }
            });
        };
        
        // Attempt to play the video once it's ready
        playerRef.current.ready(function() {
          console.log('Player ready, video loaded:', media.url);
          
          // Force show big play button
          const bigPlayBtn = document.querySelector('.vjs-big-play-button');
          if (bigPlayBtn) {
            bigPlayBtn.style.display = 'block';
            bigPlayBtn.style.opacity = '1';
            bigPlayBtn.style.visibility = 'visible';
          }
          
          // Make sure control bar is visible
          const controlBar = document.querySelector('.vjs-control-bar');
          if (controlBar) {
            controlBar.style.opacity = '1';
            controlBar.style.visibility = 'visible';
          }
          
          // Add direct click handler to the video container
          const videoContainer = document.querySelector('.video-js');
          if (videoContainer) {
            // Remove existing handlers first
            const newContainer = videoContainer.cloneNode(true);
            videoContainer.parentNode.replaceChild(newContainer, videoContainer);
            
            // Add new click handler
            newContainer.addEventListener('click', (e) => {
              // Make sure we're not clicking a control button
              if (!e.target.closest('.vjs-control-bar') && 
                  !e.target.closest('.vjs-big-play-button')) {
                console.log('Video container clicked, toggling play/pause');
                if (playerRef.current.paused()) {
                  attemptToPlay();
                } else {
                  playerRef.current.pause();
                }
              }
            });
          }
          
          // Try to start playback (will likely be blocked by browser)
          setTimeout(attemptToPlay, 300);
        });
      }
      
      // Clean up event handlers when component unmounts or changes
      return () => {
        if (playerRef.current) {
          playerRef.current.off('error', handleError);
          playerRef.current.off('canplay', handleCanPlay);
          playerRef.current.off('loadeddata', handleLoadedData);
          
          // Remove click handler
          const playerElement = document.querySelector('.video-js');
          if (playerElement) {
            playerElement.removeEventListener('click', () => {});
          }
        }
      };
    }
  }, [media, onError]);
  return (
    <div className="video-player-container">
      {media ? (
        <>
          <div data-vjs-player>
            <video
              ref={videoRef}
              className="video-js vjs-big-play-centered"
            />
            <div className="video-title-overlay">{media?.name || 'Select a channel'}</div>
            {isLoading && (
              <div className="video-loading-overlay">
                <div className="loading-spinner"></div>
                <p>Loading stream...</p>
              </div>
            )}
          </div>
        </>
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

export default VideoPlayer;
