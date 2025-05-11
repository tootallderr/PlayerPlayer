import { Parser } from 'm3u8-parser';

/**
 * Enhanced Parser for M3U/M3U8 playlists
 * Handles various IPTV formats including:
 * - Standard M3U/M3U8
 * - EXTINF with referrer and user-agent
 * - EXTVLCOPT directives
 * - TVG attributes (id, name, logo)
 * - Group title attributes
 * - Various formats from iptv-org sources
 * 
 * @param {string} content - The raw playlist content
 * @returns {Object} - Parsed playlist with items
 */
export const parseM3u = (content) => {
  try {
    // Basic m3u8-parser functionality for initialization
    const parser = new Parser();
    parser.push(content);
    parser.end();

    // Our enhanced IPTV-specific parsing
    const items = [];
    const lines = content.split('\n');
    
    let currentItem = null;
    let inExtInf = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (line === '') {
        continue;
      }
        // Handle EXTVLCOPT lines containing any HTTP headers
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
          else if (line.includes('http-user-agent=')) {
            const userAgentMatch = line.match(/http-user-agent=(.+)$/);
            if (userAgentMatch) {
              currentItem.attributes['http-user-agent'] = userAgentMatch[1].trim();
            }
          }
          
          // Store any other EXTVLCOPT HTTP headers
          else if (line.includes('http-')) {
            // Extract the header name and value
            const headerMatch = line.match(/#EXTVLCOPT:http-([^=]+)=(.+)$/);
            if (headerMatch) {
              const headerName = headerMatch[1].trim();
              const headerValue = headerMatch[2].trim();
              currentItem.attributes[`EXTVLCOPT:http-${headerName}`] = headerValue;
              console.log(`Found custom header: ${headerName}=${headerValue}`);
            }
          }
        }
        continue;
      }
      
      // Handle KODIPROP lines which might contain headers
      if (line.startsWith('#KODIPROP:') || line.startsWith('#EXTKODIPROP:')) {
        if (currentItem) {
          // Handle referrer
          if (line.includes('Referer=')) {
            const match = line.match(/Referer=(.+)$/);
            if (match) {
              currentItem.attributes['http-referrer'] = match[1].trim();
            }
          }
          
          // Handle user-agent
          if (line.includes('User-Agent=')) {
            const match = line.match(/User-Agent=(.+)$/);
            if (match) {
              currentItem.attributes['http-user-agent'] = match[1].trim();
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
        }
        
        // Parse all TVG attributes with a single regex
        const tvgAttributes = [
          { pattern: /tvg-id="([^"]*)"/i, key: 'id' },
          { pattern: /tvg-name="([^"]*)"/i, key: 'name' },
          { pattern: /tvg-logo="([^"]*)"/i, key: 'logo' },
          { pattern: /tvg-language="([^"]*)"/i, key: 'language' },
          { pattern: /tvg-country="([^"]*)"/i, key: 'country' },
          { pattern: /tvg-url="([^"]*)"/i, key: 'url' }
        ];
        
        tvgAttributes.forEach(attr => {
          const match = line.match(attr.pattern);
          if (match && match[1]) {
            currentItem.tvg[attr.key] = match[1];
          }
        });
        
        // Parse group info
        const groupTitleMatch = line.match(/group-title="([^"]*)"/i);
        if (groupTitleMatch && groupTitleMatch[1]) {
          currentItem.group.title = groupTitleMatch[1];
        }
        
        // Parse channel name
        const nameMatch = line.match(/,(.+)$/);
        if (nameMatch) {
          let channelName = nameMatch[1].trim();
          
          // Extract HTTP referrer and user agent with multiple patterns
          // Handle quoted and unquoted patterns
          const httpReferrerPatterns = [
            /http-referrer="([^"]*)"/i,
            /http-referrer=([^ ]*)/i
          ];
          
          const userAgentPatterns = [
            /http-user-agent="([^"]*)"/i,
            /http-user-agent=([^ ]*)/i
          ];
          
          // Try all referrer patterns
          for (const pattern of httpReferrerPatterns) {
            const match = line.match(pattern);
            if (match && match[1]) {
              currentItem.attributes['http-referrer'] = match[1];
              break;
            }
          }
          
          // Try all user agent patterns
          for (const pattern of userAgentPatterns) {
            const match = line.match(pattern);
            if (match && match[1]) {
              currentItem.attributes['http-user-agent'] = match[1];
              break;
            }
          }
          
          // Clean channel name from attributes
          if (channelName.includes('http-referrer=') || channelName.includes('http-user-agent=')) {
            // Extract channel name from the string containing user-agent or referrer
            const cleanNameMatch = channelName.match(/^(.*?)(\s+http-referrer=|\s+http-user-agent=)/);
            if (cleanNameMatch && cleanNameMatch[1]) {
              channelName = cleanNameMatch[1].trim();
            }
            
            // Try to extract values from the name if not found in attributes
            if (!currentItem.attributes['http-referrer']) {
              for (const pattern of httpReferrerPatterns) {
                const match = channelName.match(pattern);
                if (match && match[1]) {
                  currentItem.attributes['http-referrer'] = match[1];
                  break;
                }
              }
            }
            
            if (!currentItem.attributes['http-user-agent']) {
              for (const pattern of userAgentPatterns) {
                const match = channelName.match(pattern);
                if (match && match[1]) {
                  currentItem.attributes['http-user-agent'] = match[1];
                  break;
                }
              }
            }
          }
          
          // Keep geo-blocked information
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
      } else if (inExtInf && !line.startsWith('#')) {
        // This is the URL that follows the EXTINF line
        inExtInf = false;
        if (currentItem) {
          currentItem.url = line;
          
          // Set a default media type based on URL extension
          if (line.endsWith('.m3u8')) {
            currentItem.type = 'application/x-mpegURL';
          } else if (line.endsWith('.mp4')) {
            currentItem.type = 'video/mp4';
          } else if (line.endsWith('.mp3')) {
            currentItem.type = 'audio/mp3';
          } else {
            currentItem.type = 'application/x-mpegURL'; // Default to HLS
          }
          
          // Add the item to our list
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
