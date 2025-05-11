const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object
let mainWindow;

function createWindow() {  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '..', 'public', 'icon.png')
  });  // Set proper Content Security Policy for development
  if (isDev) {
    // Enable HMR WebSocket connections
    mainWindow.webContents.session.webRequest.onHeadersReceived({ urls: ['*://*/*'] },
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': ["script-src 'self' 'unsafe-eval' 'unsafe-inline' localhost:*; media-src * blob: data:;"]
          }
        });
      }
    );
  }
  
  // Enable CORS for all requests to help with IPTV streams
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['*://*/*'] },
    (details, callback) => {
      details.requestHeaders['Origin'] = '*';
      details.requestHeaders['Access-Control-Allow-Origin'] = '*';
      
      // Default User-Agent to help with streams that require specific headers
      if (!details.requestHeaders['User-Agent']) {
        details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
      }
      
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  // Load the app
  if (isDev) {
    // In development, load from the dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools automatically
    mainWindow.webContents.openDevTools();
    
    // Watch for changes in dev mode for fast refresh
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('dev-mode', true);
    });  } else {
    // In production, load the built app
    const distPath = path.join(__dirname, '..', 'dist', 'index.html');
    console.log('Loading app from:', distPath);
    mainWindow.loadFile(distPath);
    
    // Open DevTools in production for debugging white screen
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  // Add a filter to modify headers for all requests (specifically for media files)
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.m3u8*', '*://*.ts*', '*://*.mp4*', '*://*.mpd*', '*://*/playlist*'] },
    (details, callback) => {
      const url = details.url;
      const urlObj = new URL(url);
      const baseUrl = urlObj.origin + urlObj.pathname;
      
      // Check if we have specific headers for this URL
      let matchedHeaders = null;
      
      // Try direct match first
      if (streamHeaders.has(url)) {
        matchedHeaders = streamHeaders.get(url);
      } 
      // Try matching just the origin and path
      else if (streamHeaders.has(baseUrl)) {
        matchedHeaders = streamHeaders.get(baseUrl);
      }
      // Try to find a matching URL pattern (handles tokens in URLs)
      else {
        for (const [storedUrl, storedHeaders] of streamHeaders.entries()) {
          // Check if the stored URL is a prefix of the current URL
          if (url.startsWith(storedUrl.split('?')[0])) {
            matchedHeaders = storedHeaders;
            break;
          }
        }
      }
      
      if (matchedHeaders) {
        console.log(`Applying custom headers for ${url}`);
        Object.keys(matchedHeaders).forEach(header => {
          if (matchedHeaders[header]) {
            details.requestHeaders[header] = matchedHeaders[header];
          }
        });
      }
      
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle file selection
ipcMain.handle('select-playlist-files', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Playlists', extensions: ['m3u', 'm3u8'] }
    ]
  });
  if (canceled) {
    return [];
  }
  return filePaths;
});

// Handle file read
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

// Track custom headers for specific stream URLs
const streamHeaders = new Map();

// Handle setting request headers for specific streams
ipcMain.handle('set-stream-headers', (event, { url, headers }) => {  if (url && headers) {
    console.log(`Setting headers for stream ${url}:`, headers);
    streamHeaders.set(url, headers);
    return true;
  }
  return false;
});

// Handle custom HTTP headers for IPTV streams
let requestHeadersStore = {};

ipcMain.handle('set-request-headers', (event, headers) => {
  console.log('Setting global request headers:', headers);
  requestHeadersStore = { ...headers };
  return true;
});

// Set up a web request filter to add headers to all media requests
app.whenReady().then(() => {
  if (!mainWindow) createWindow();
  const session = mainWindow.webContents.session;
  session.webRequest.onBeforeSendHeaders({ 
    urls: ['*://*/*'] 
  }, (details, callback) => {
    const { url } = details;
    
    // Check if this is a media request (common media extensions)
    const isMediaRequest = /\.(m3u8|ts|mp4|mp3|mpd|mov|avi|mkv)($|\?)/.test(url) ||
                           url.includes('stream') || 
                           url.includes('hls') || 
                           url.includes('live');
                           
    if (isMediaRequest && Object.keys(requestHeadersStore).length > 0) {
      console.log(`Applying headers to request: ${url}`);
      
      // Add our custom headers to the request
      const requestHeaders = {
        ...details.requestHeaders
      };
      
      // Apply stored headers
      Object.keys(requestHeadersStore).forEach(header => {
        const headerValue = requestHeadersStore[header];
        if (headerValue) {
          // Convert header name to proper case (e.g. "referer" -> "Referer")
          const properHeader = header.charAt(0).toUpperCase() + header.slice(1).toLowerCase();
          requestHeaders[properHeader] = headerValue;
        }
      });
      
      callback({ requestHeaders });
    } else {
      callback({ requestHeaders: details.requestHeaders });
    }
  });
});

// Add CORS and security handling
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('disable-site-isolation-trials');

// Enable CORS bypass for video playback
app.whenReady().then(() => {
  if (!mainWindow) createWindow();
  
  const webContents = mainWindow.webContents;
  const session = webContents.session;
  
  // Allow CORS for any domain
  session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = {
      ...details.responseHeaders,
      'Access-Control-Allow-Origin': ['*'],
      'Access-Control-Allow-Methods': ['*'],
      'Access-Control-Allow-Headers': ['*']
    };
    callback({ responseHeaders });
  });
});
