import { Parser } from 'm3u8-parser';

/**
 * Parse an M3U playlist file content
 * @param {string} content - The raw playlist content
 * @returns {Object} - Parsed playlist with items
 */
export const parseM3u = (content) => {
  try {
    // Basic m3u8-parser functionality
    const parser = new Parser();
    parser.push(content);
    parser.end();

    // But we need to handle IPTV-specific extensions
    const items = [];
    const lines = content.split('\n');
    
    let currentItem = null;
    let inExtInf = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();      // Skip empty lines
      if (line === '') {
        continue;
      }
      
      // Handle EXTVLCOPT lines that might contain referrer or user-agent
      if (line.startsWith('#EXTVLCOPT:')) {
        if (currentItem) {
          // Capture HTTP referrer
          if (line.includes('http-referrer=')) {
            const referrerMatch = line.match(/http-referrer=(.+)$/);
            if (referrerMatch) {
              currentItem.attributes['http-referrer'] = referrerMatch[1].trim();
            }
          }
          
          // Capture user-agent
          if (line.includes('http-user-agent=')) {
            const userAgentMatch = line.match(/http-user-agent=(.+)$/);
            if (userAgentMatch) {
              currentItem.attributes['http-user-agent'] = userAgentMatch[1].trim();
            }
          }
        }
        continue;
      }
      
      // Skip other comment lines that are not EXTINF
      if (line.startsWith('#') && !line.startsWith('#EXTINF')) {
        continue;
      }

      if (line.startsWith('#EXTINF')) {
        // New channel definition
        inExtInf = true;
        currentItem = {
          duration: -1,
          tvg: {},
          group: {},
          attributes: {},
        };

        // Parse duration
        const durationMatch = line.match(/#EXTINF:(-?\d+(\.\d+)?)/);
        if (durationMatch) {
          currentItem.duration = parseFloat(durationMatch[1]);
        }        // Parse channel name
        const nameMatch = line.match(/,(.+)$/);
        if (nameMatch) {
          let channelName = nameMatch[1].trim();
            // Extract HTTP referrer and user agent
          // Handle both pattern formats: http-referrer="..." and http-referrer=...
          const httpReferrerMatch = line.match(/http-referrer="([^"]*)"/i) || 
                                   line.match(/http-referrer=([^ ]*)/i);
          if (httpReferrerMatch) {
            currentItem.attributes['http-referrer'] = httpReferrerMatch[1];
          }
          
          const userAgentMatch = line.match(/http-user-agent="([^"]*)"/i) || 
                               line.match(/http-user-agent=([^ ]*)/i);
          if (userAgentMatch) {
            currentItem.attributes['http-user-agent'] = userAgentMatch[1];
          }
          
          // Also handle cases where these are part of tvg-id field
          const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
          if (tvgIdMatch) {
            currentItem.tvg.id = tvgIdMatch[1];
          }
          
          // Check if the channel name itself contains referrer/user-agent info
          if (channelName.includes('http-referrer=') || channelName.includes('http-user-agent=')) {
            // Extract channel name from the string containing user-agent or referrer
            const cleanNameMatch = channelName.match(/^(.*?)(\s+http-referrer=|\s+http-user-agent=)/);
            if (cleanNameMatch && cleanNameMatch[1]) {
              channelName = cleanNameMatch[1].trim();
            }
            
            // Try to extract the referrer value directly from the name if not found in attributes
            if (!currentItem.attributes['http-referrer']) {
              const nameReferrerMatch = channelName.match(/http-referrer="([^"]*)"/);
              if (nameReferrerMatch) {
                currentItem.attributes['http-referrer'] = nameReferrerMatch[1];
              }
            }
            
            // Try to extract the user-agent value directly from the name if not found in attributes
            if (!currentItem.attributes['http-user-agent']) {
              const nameUserAgentMatch = channelName.match(/http-user-agent="([^"]*)"/);
              if (nameUserAgentMatch) {
                currentItem.attributes['http-user-agent'] = nameUserAgentMatch[1];
              }
            }
          }
          
          // If it contains [Geo-blocked], keep that information
          if (channelName.includes('[Geo-blocked]')) {
            const geoBlockedMatch = channelName.match(/(.*?)(\s*\[Geo-blocked\])/);
            if (geoBlockedMatch) {
              channelName = geoBlockedMatch[1].trim() + ' [Geo-blocked]';
            }
          }
          
          currentItem.name = channelName;
        } else {
          // No name found, use a placeholder
          currentItem.name = `Channel ${items.length + 1}`;
        }

        // Parse TVG info (EPG data)
        const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
        if (tvgNameMatch) {
          currentItem.tvg.name = tvgNameMatch[1];
        }

        const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
        if (tvgLogoMatch) {
          currentItem.tvg.logo = tvgLogoMatch[1];
        }

        const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
        if (tvgIdMatch) {
          currentItem.tvg.id = tvgIdMatch[1];
        }

        // Parse group info
        const groupTitleMatch = line.match(/group-title="([^"]*)"/);
        if (groupTitleMatch) {
          currentItem.group.title = groupTitleMatch[1];
        }
      } else if (inExtInf && !line.startsWith('#')) {
        // This is the URL that follows the EXTINF line
        inExtInf = false;
        if (currentItem) {
          currentItem.url = line;
          items.push(currentItem);
          currentItem = null;
        }
      }
    }

    return { items };
  } catch (error) {
    console.error('Error parsing M3U playlist:', error);
    return { items: [] };
  }
};
