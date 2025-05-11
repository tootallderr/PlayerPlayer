# CrossPlay IPTV

Cross-platform IPTV media player built with Electron and React. Watch your favorite channels from multiple IPTV sources with seamless playlist merging.

## Features

- ⏯️ Full playback controls (Play, Pause, Rewind, Fast Forward, Volume)
- 📂 Add multiple M3U or M3U8 playlists (URL or local file)
- 🧠 Merge all playlists into a single working list
- 🔄 Automatically refresh merged list on app load
- 💾 Cache playlists locally between sessions
- 🔍 Search and filter channels by name or category
- 🌓 Dark/Light theme toggle for comfortable viewing
- 🖥️ Compatible with Windows, macOS, and Linux
- 🚀 Default playlists included for immediate viewing

## Tech Stack

- [Electron](https://www.electronjs.org/) – Desktop runtime
- [React](https://reactjs.org/) – UI framework
- [Vite](https://vitejs.dev/) – Build tool with HMR
- [video.js](https://videojs.com/) – Media playback
- [`m3u8-parser`](https://github.com/videojs/m3u8-parser) – Playlist parsing

## Development Setup (macOS)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tootallderr/PlayerPlayer.git
   cd crossplay-iptv
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   This will launch the app in development mode. The Electron window should open automatically. If not, run `npm run electron` in a separate terminal.

## Building the Application (macOS)

To create a production-ready macOS app (a `.app` bundle):

```bash
npm run build:mac
```

The built application will be located in the `dist` or `out` directory (check your project's build output folder). You can open the `.app` file directly or move it to your `/Applications` folder.

## Usage Instructions (macOS)

1. **Launch the application:**  
   Double-click the CrossPlay IPTV `.app` file, or run it from the terminal:
   ```bash
   open dist/CrossPlay\ IPTV.app
   ```
2. **Default playlists:**  
   On first launch, several preset IPTV playlists will load automatically.

3. **Add a new playlist:**  
   - Enter a playlist URL in the input field and click "Add URL".
   - Or click "Open Local Files" to select M3U/M3U8 files from your Mac.

4. **Browse and play channels:**  
   - Browse channels by category in the sidebar.
   - Use the search field to filter channels by name.
   - Click any channel to start playback.

5. **Theme toggle:**  
   - Switch between dark and light mode using the button in the header.

**Note:**  
If you encounter a security warning when opening the app, right-click the `.app` and select "Open" to bypass Gatekeeper for unsigned apps.

## Default Playlists

The application includes the following default playlists:
- IPTV.org - MoveOnJoy US Channels
- TVPass.org Playlist
- IPTV.org - TheTVApp US Channels
- IPTV.org - TVPass US Channels
- IPTV.org - US Local Channels
- IPTV.org - US Channels
- GitHub IPTV Big List

"# PlayerPlayer" 
