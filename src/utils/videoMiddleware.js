/**
 * Custom middleware for VideoJS to handle HTTP headers for IPTV streams
 * This helps with streams that require specific referrer or user-agent headers
 */

// Create middleware to inject headers into HTTP requests
export const createHeadersMiddleware = () => {
  const headersMiddleware = {
    setSource: function(srcObj, next) {
      // Check if headers are provided in the source object
      if (srcObj.src && srcObj.headers) {
        console.log('Headers middleware activated with:', srcObj.headers);
        
        // Create a middleware handler for XHR requests
        const xhr = new window.XMLHttpRequest();
        const open = xhr.open;
        
        // Override the XHR open method to add headers
        window.XMLHttpRequest.prototype.open = function() {
          const result = open.apply(this, arguments);
          
          // Check if this XHR request URL matches our video source URL
          const requestUrl = arguments[1];
          if (requestUrl.includes(srcObj.src) || srcObj.src.includes(requestUrl)) {
            // Apply all headers from the source object
            Object.keys(srcObj.headers).forEach(header => {
              this.setRequestHeader(header, srcObj.headers[header]);
            });
            
            console.log('Applied headers to request:', requestUrl);
          }
          
          return result;
        };
      }
      
      // Continue the middleware chain
      return next(null, srcObj);
    }
  };
  
  return headersMiddleware;
};

// Create middleware for HLS-specific processing
export const createHlsHeadersMiddleware = () => {
  return {
    beforeRequest: function(options) {
      // Get headers from the player's current source
      const player = videojs.getPlayers()[Object.keys(videojs.getPlayers())[0]];
      
      if (player && player.currentSource_ && player.currentSource_.headers) {
        const headers = player.currentSource_.headers;
        
        // Apply the headers to HLS requests
        if (!options.headers) {
          options.headers = {};
        }
        
        Object.keys(headers).forEach(header => {
          options.headers[header] = headers[header];
        });
        
        console.log('Applied headers to HLS request:', options.uri);
      }
      
      return options;
    }
  };
};

// Helper function to add electron-specific headers handling
export const setupElectronHeaderHandling = (media) => {
  // This function is used when running in Electron to handle headers at a lower level
  if (window.electron && window.electron.setRequestHeaders) {
    const headers = {};
    
    // Extract referrer and user-agent from media
    if (media && media.attributes) {
      if (media.attributes['http-referrer']) {
        headers['Referer'] = media.attributes['http-referrer'];
      }
      if (media.attributes['http-user-agent']) {
        headers['User-Agent'] = media.attributes['http-user-agent'];
      }
    }
    
    if (Object.keys(headers).length > 0) {
      console.log('Setting Electron request headers:', headers);
      window.electron.setRequestHeaders(headers);
    }
  }
};
