// DEBUG: Log selected channel and video URL
import React, { useState, useEffect } from 'react';
import videojs from 'video.js';
import './PlaylistView.css';

const PlaylistView = ({ playlist, onSelectMedia, currentMedia }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlaylist, setFilteredPlaylist] = useState([]);
  
  useEffect(() => {
    if (!playlist || playlist.length === 0) {
      setFilteredPlaylist([]);
      return;
    }
    
    if (!searchTerm) {
      setFilteredPlaylist(playlist);
      return;
    }
    
    const filtered = playlist.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.group && item.group.title && item.group.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredPlaylist(filtered);
  }, [playlist, searchTerm]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchTerm('');
  };
  
  // Group channels by category
  const getGroupedChannels = () => {
    const groups = {};
    
    filteredPlaylist.forEach(item => {
      const groupTitle = item.group?.title || 'Uncategorized';
      if (!groups[groupTitle]) {
        groups[groupTitle] = [];
      }
      groups[groupTitle].push(item);
    });
    
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  };
  
  const groupedChannels = getGroupedChannels();
  
  return (
    <div className="playlist-view">
      <div className="playlist-header">
        <h2>Channels ({filteredPlaylist.length})</h2>
        <div className="search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search channels..."
          />
          {searchTerm && (
            <button className="clear-search" onClick={clearSearch}>✕</button>
          )}
        </div>
      </div>
      
      {filteredPlaylist.length === 0 ? (
        <div className="no-channels">
          {playlist.length === 0 ? 'No channels available. Add a playlist first.' : 'No matching channels found.'}
        </div>
      ) : (
        <div className="channels-list">
          {groupedChannels.map(([groupTitle, channels]) => (
            <div key={groupTitle} className="channel-group">
              <div className="group-title">{groupTitle} ({channels.length})</div>              {channels.map(channel => (                <div
                  key={channel.name}
                  className={`channel-item ${currentMedia && currentMedia.name === channel.name ? 'active' : ''}`}                  onClick={() => {
                    // Set HTTP headers if channel has them and we're in Electron environment
                    if (window.electron && channel.attributes) {
                      const headers = {};
                      
                      // Extract headers from channel attributes
                      if (channel.attributes['http-referrer']) {
                        headers['Referer'] = channel.attributes['http-referrer'];
                      }
                      
                      if (channel.attributes['http-user-agent']) {
                        headers['User-Agent'] = channel.attributes['http-user-agent'];
                      }
                      
                      // Look for any additional EXTVLCOPT headers
                      Object.keys(channel.attributes).forEach(key => {
                        if (key.startsWith('EXTVLCOPT:http-')) {
                          const headerName = key.replace('EXTVLCOPT:http-', '');
                          headers[headerName] = channel.attributes[key];
                        }
                      });
                      
                      // Set headers at Electron level
                      if (Object.keys(headers).length > 0) {
                        try {
                          // Set for this specific stream URL
                          window.electron.setStreamHeaders(channel.url, headers);
                          
                          // Also set as global fallback
                          window.electron.setRequestHeaders(headers);
                        } catch (err) {
                          console.error('Failed to set headers:', err);
                        }
                      }
                    }
                    
                    // Set the channel as current media
                    onSelectMedia(channel);
                  }}                  onDoubleClick={() => {
                    // Double-click should both select the channel and force play
                    onSelectMedia(channel);
                    
                    // Force playback on double-click after a brief delay to allow player to initialize
                    setTimeout(() => {
                      try {
                        // Try to play through the direct-video-element
                        const videoEl = document.querySelector('.direct-video-element');
                        if (videoEl) {
                          videoEl.play().catch(err => console.warn('Auto-play prevented:', err));
                        }
                      } catch (err) {
                        console.warn('Error during auto-play attempt:', err);
                      }
                    }, 500);
                  }}
                >                  {channel.tvg && channel.tvg.logo ? (
                    <div className="channel-logo">
                      <img src={channel.tvg.logo} alt={channel.name} onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  ) : (
                    <div className="channel-logo placeholder">TV</div>
                  )}
                  <div className="channel-name">{channel.name}</div>
                  <div 
                    className="channel-play-button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the parent click handler
                      onSelectMedia(channel);
                      
                      // Immediately try playing
                      setTimeout(() => {
                        try {
                          const playerEl = document.querySelector('.video-js');
                          if (playerEl && playerEl.player) {
                            playerEl.player.play();
                          }
                        } catch (err) {
                          console.warn('Error during play button click:', err);
                        }
                      }, 300);
                    }}
                    title="Play Channel"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistView;
