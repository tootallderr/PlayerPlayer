import React, { useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import DirectVideoPlayer from './components/DirectVideoPlayer'; // Import the new player
import PlaylistManager from './components/PlaylistManager';
import PlaylistView from './components/PlaylistView';
import Header from './components/Header';
import './App.css';

function App() {
  const [playlists, setPlaylists] = useState([]);
  const [mergedPlaylist, setMergedPlaylist] = useState([]);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [theme, setTheme] = useState('light');
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

  // Load cached playlists from localStorage on startup
  useEffect(() => {
    const loadStoredData = async () => {
      const cachedPlaylists = localStorage.getItem('playlists');
      const cachedMergedPlaylist = localStorage.getItem('mergedPlaylist');
      
      if (cachedPlaylists) {
        setPlaylists(JSON.parse(cachedPlaylists));
      }
      
      if (cachedMergedPlaylist) {
        setMergedPlaylist(JSON.parse(cachedMergedPlaylist));
      }

      // Load theme preference
      const savedTheme = localStorage.getItem('theme') || 'light';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      
      // Give the app a moment to initialize
      setTimeout(() => {
        setIsInitializing(false);
      }, 1000);
    };
    
    loadStoredData();
  }, []);

  // Update localStorage when playlists or merged playlist changes
  useEffect(() => {
    if (playlists.length > 0) {
      localStorage.setItem('playlists', JSON.stringify(playlists));
    }
    if (mergedPlaylist.length > 0) {
      localStorage.setItem('mergedPlaylist', JSON.stringify(mergedPlaylist));
    }
  }, [playlists, mergedPlaylist]);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const playMedia = (mediaItem) => {
    setCurrentMedia(mediaItem);
  };  // Show error notification
  const displayError = (message) => {
    setError(message);
    setShowError(true);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowError(false);
    }, 5000);
  };

  // Dismiss error notification
  const dismissError = () => {
    setShowError(false);
  };

  return (
    <div className="app">
      <Header theme={theme} onThemeToggle={handleThemeToggle} />
      
      {/* Error Notification */}
      {showError && (
        <div className="error-notification">
          <div className="error-content">
            <span>{error}</span>
            <button onClick={dismissError} className="error-close">×</button>
          </div>
        </div>
      )}
      
      {isInitializing ? (
        <div className="initializing-container">
          <div className="loading-spinner"></div>
          <p>Loading playlists...</p>
        </div>
      ) : (
        <div className="main-content">
          <div className="sidebar">
            <PlaylistManager 
              playlists={playlists} 
              setPlaylists={setPlaylists} 
              setMergedPlaylist={setMergedPlaylist} 
              onError={displayError}
            />
            <PlaylistView 
              playlist={mergedPlaylist} 
              onSelectMedia={playMedia} 
              currentMedia={currentMedia} 
            />
          </div>          <div className="player-container">
            <DirectVideoPlayer media={currentMedia} onError={displayError} />
            {currentMedia && (
              <div className="channel-info">
                <h3>{currentMedia.name}</h3>
                {currentMedia.group && currentMedia.group.title && (
                  <span className="channel-group-tag">{currentMedia.group.title}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
