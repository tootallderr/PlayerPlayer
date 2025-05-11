import React, { useState, useEffect } from 'react';
import { parseM3u } from '../utils/enhancedPlaylistParser';
import { defaultPlaylists } from '../utils/defaultPlaylists';
import './PlaylistManager.css';

const PlaylistManager = ({ playlists, setPlaylists, setMergedPlaylist, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loadingStatus, setLoadingStatus] = useState('');
    // Helper function to fetch playlist content
  const fetchPlaylistContent = async (url) => {
    try {
      // Special handling for TVPass.org
      if (url.includes('tvpass.org/playlist')) {
        // First fetch the webpage to extract the actual M3U URL
        const response = await fetch(url);
        if (response.ok) {
          const html = await response.text();
          
          // Try to extract the direct M3U link from the page
          const linkMatch = html.match(/href="(https:\/\/tvpass\.org\/.*\.m3u)"/i);
          if (linkMatch && linkMatch[1]) {
            const directM3uUrl = linkMatch[1];
            console.log(`Found direct M3U link for TVPass: ${directM3uUrl}`);
            
            // Now fetch the actual M3U content
            const m3uResponse = await fetch(directM3uUrl);
            if (m3uResponse.ok) {
              return await m3uResponse.text();
            }
          }
          
          // If we couldn't extract a link, try to parse the page directly as it might contain M3U data
          if (html.includes('#EXTM3U')) {
            return html;
          }
        }
        throw new Error('Could not extract M3U content from TVPass.org');
      } else {
        // Normal handling for other URLs
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch playlist: ${response.status} ${response.statusText}`);
        }
        return await response.text();
      }
    } catch (error) {
      console.error(`Error fetching playlist from ${url}:`, error);
      throw error;
    }
  };

  // Load default playlists on component mount
  useEffect(() => {    const loadDefaultPlaylists = async () => {
      // Skip if playlists are already loaded from localStorage
      if (playlists.length > 0) return;
      
      setIsLoading(true);
      let loadedCount = 0;
      let failedCount = 0;
      
      for (const defaultPlaylist of defaultPlaylists) {
        try {
          setLoadingStatus(`Loading ${defaultPlaylist.name}...`);
          const content = await fetchPlaylistContent(defaultPlaylist.url);
          const parsedPlaylist = parseM3u(content);
          
          if (parsedPlaylist.items && parsedPlaylist.items.length > 0) {
            loadedCount++;
            setPlaylists(prevPlaylists => {
              const newPlaylist = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: defaultPlaylist.name,
                url: defaultPlaylist.url,
                items: parsedPlaylist.items
              };
              
              const updatedPlaylists = [...prevPlaylists, newPlaylist];
              // Merge playlists after each addition
              mergePlaylists(updatedPlaylists);
              return updatedPlaylists;
            });
          } else {
            failedCount++;
            console.warn(`No channels found in ${defaultPlaylist.name}`);
          }
        } catch (error) {
          failedCount++;
          console.error(`Error loading default playlist ${defaultPlaylist.url}:`, error);
          if (onError) {
            onError(`Failed to load ${defaultPlaylist.name}`);
          }
        }
      }
      
      setLoadingStatus('');
      setIsLoading(false);
      
      // Display summary message
      if (loadedCount > 0 && failedCount > 0) {
        if (onError) {
          onError(`Loaded ${loadedCount} playlists successfully. ${failedCount} failed to load.`);
        }
      }
    };
    
    loadDefaultPlaylists();
  }, []);
    const addPlaylistFromUrl = async () => {
    if (!playlistUrl) return;
    
    try {
      setIsLoading(true);
      
      const content = await fetchPlaylistContent(playlistUrl);
      const parsedPlaylist = parseM3u(content);
      
      if (parsedPlaylist.items && parsedPlaylist.items.length > 0) {
        // Create a more descriptive name based on the URL
        let playlistName = '';
        
        try {
          const url = new URL(playlistUrl);
          const hostParts = url.hostname.split('.');
          if (hostParts.length >= 2) {
            playlistName = hostParts[hostParts.length - 2];
            // Capitalize first letter
            playlistName = playlistName.charAt(0).toUpperCase() + playlistName.slice(1);
          }
          
          // Add path info if it might be meaningful
          const pathParts = url.pathname.split('/').filter(p => p);
          if (pathParts.length > 0) {
            const lastPath = pathParts[pathParts.length - 1];
            if (lastPath && !lastPath.endsWith('.m3u') && !lastPath.endsWith('.m3u8')) {
              playlistName += ' - ' + lastPath;
            }
          }
        } catch (e) {
          // If URL parsing fails, fall back to simple name extraction
          playlistName = playlistUrl.split('/').pop() || 'Playlist';
        }
        
        if (!playlistName || playlistName === '') {
          playlistName = 'Playlist ' + (playlists.length + 1);
        }
        
        const newPlaylist = {
          id: Date.now().toString(),
          name: playlistName,
          url: playlistUrl,
          items: parsedPlaylist.items
        };
        
        const updatedPlaylists = [...playlists, newPlaylist];
        setPlaylists(updatedPlaylists);
        mergePlaylists(updatedPlaylists);
        setPlaylistUrl('');
      } else {
        alert('No channels found in the playlist. Please check the URL and try again.');
      }    } catch (error) {
      console.error('Error adding playlist from URL:', error);
      if (onError) {
        onError('Failed to load playlist. Please check the URL and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const addPlaylistsFromFiles = async () => {
    if (!window.electron) {
      console.error('Electron API not available');
      return;
    }
    
    try {
      setIsLoading(true);
      const filePaths = await window.electron.selectPlaylistFiles();
      
      if (filePaths.length === 0) {
        setIsLoading(false);
        return;
      }
      
      const newPlaylists = [];
      
      for (const filePath of filePaths) {
        try {
          const content = await window.electron.readFile(filePath);
          const parsedPlaylist = parseM3u(content);
          
          if (parsedPlaylist.items && parsedPlaylist.items.length > 0) {
            const fileName = filePath.split(/[\\\/]/).pop();
            newPlaylists.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: fileName || 'Local Playlist',
              url: filePath,
              items: parsedPlaylist.items
            });
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }
      
      if (newPlaylists.length > 0) {
        const updatedPlaylists = [...playlists, ...newPlaylists];
        setPlaylists(updatedPlaylists);
        mergePlaylists(updatedPlaylists);
      }
    } catch (error) {
      console.error('Error adding playlists from files:', error);
      alert('Failed to load playlists from files.');
    } finally {
      setIsLoading(false);
    }
  };
    const removePlaylist = (playlistId) => {
    const playlistToRemove = playlists.find(p => p.id === playlistId);
    const updatedPlaylists = playlists.filter(playlist => playlist.id !== playlistId);
    setPlaylists(updatedPlaylists);
    mergePlaylists(updatedPlaylists);
    
    if (playlistToRemove && onError) {
      onError(`Removed playlist: ${playlistToRemove.name}`);
    }
  };
    const mergePlaylists = (playlistsToMerge) => {
    const mergedItems = [];
    const seenChannels = new Map(); // Use Map instead of Set to track indices
    
    playlistsToMerge.forEach(playlist => {
      playlist.items.forEach(item => {
        // Use channel name as a unique identifier
        const channelId = item.name;
        
        // Ensure the item has an attributes object
        if (!item.attributes) {
          item.attributes = {};
        }
        
        if (!seenChannels.has(channelId)) {
          // First time seeing this channel, add it to merged list
          seenChannels.set(channelId, mergedItems.length);
          mergedItems.push(item);
        } else {
          // We've seen this channel before, merge their attributes
          const existingIndex = seenChannels.get(channelId);
          
          // Merge HTTP headers and other attributes
          if (item.attributes) {
            mergedItems[existingIndex].attributes = { 
              ...mergedItems[existingIndex].attributes,
              ...item.attributes
            };
          }
          
          // If the existing one doesn't have a logo but this one does, use this logo
          if (item.tvg && item.tvg.logo && (!mergedItems[existingIndex].tvg || !mergedItems[existingIndex].tvg.logo)) {
            if (!mergedItems[existingIndex].tvg) {
              mergedItems[existingIndex].tvg = {};
            }
            mergedItems[existingIndex].tvg.logo = item.tvg.logo;
          }
          
          // If this item has a group but existing doesn't, use this group
          if (item.group && item.group.title && (!mergedItems[existingIndex].group || !mergedItems[existingIndex].group.title)) {
            mergedItems[existingIndex].group = { ...item.group };
          }
        }
      });
    });
    
    // Sort by group then name
    mergedItems.sort((a, b) => {
      const groupA = a.group?.title || 'Uncategorized';
      const groupB = b.group?.title || 'Uncategorized';
      
      if (groupA === groupB) {
        return a.name.localeCompare(b.name);
      }
      return groupA.localeCompare(groupB);
    });
    
    // Log headers for debugging
    mergedItems.forEach(item => {
      if (item.attributes) {
        const headers = Object.entries(item.attributes)
          .filter(([key]) => key.includes('http-') || key.startsWith('EXTVLCOPT:'))
          .map(([key, value]) => `${key}=${value}`);
        
        if (headers.length > 0) {
          console.log(`Headers for channel "${item.name}": ${headers.join(', ')}`);
        }
      }
    });
    
    setMergedPlaylist(mergedItems);
  };
  
  return (
    <div className="playlist-manager">
      <h2>Playlist Manager</h2>
        <div className="playlist-controls">
        <div className="url-input">
          <input
            type="text"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            placeholder="Enter M3U playlist URL"
            disabled={isLoading}
          />
          <button onClick={addPlaylistFromUrl} disabled={isLoading || !playlistUrl}>
            {isLoading ? 'Loading...' : 'Add URL'}
          </button>
        </div>
        
        <button className="file-button" onClick={addPlaylistsFromFiles} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Open Local Files'}
        </button>
        
        {isLoading && loadingStatus && (
          <div className="loading-status">
            <div className="loading-spinner-small"></div>
            <span>{loadingStatus}</span>
          </div>
        )}
      </div>
      
      <div className="playlists-list">
        <h3>Loaded Playlists ({playlists.length})</h3>
        {playlists.length === 0 ? (
          <p className="no-playlists">No playlists added yet.</p>
        ) : (
          <ul>
            {playlists.map(playlist => (
              <li key={playlist.id}>
                <span className="playlist-name" title={playlist.url}>
                  {playlist.name} ({playlist.items.length} channels)
                </span>
                <button
                  className="remove-button"
                  onClick={() => removePlaylist(playlist.id)}
                  title="Remove playlist"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlaylistManager;
