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

## Development Setup (Windows, macOS, Linux)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/PlayerPlayer
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

## Building the Application

To create a production-ready app for your platform:

- **Windows:**
  ```bash
  npm run build:win
  ```
  The built `.exe` installer or portable app will be in the `dist` or `out` directory.

- **macOS:**
  ```bash
  npm run build:mac
  ```
  The built `.app` bundle will be in the `dist` or `out` directory.

- **Linux:**
  ```bash
  npm run build:linux
  ```
  The built `.AppImage`, `.deb`, or other Linux package will be in the `dist` or `out` directory.

Check your project's build output folder for the final application.

## Usage Instructions

1. **Launch the application:**  
   - **Windows:** Double-click the `.exe` file or run it from the terminal.
   - **macOS:** Double-click the `.app` file, or run:
     ```bash
     open dist/CrossPlay\ IPTV.app
     ```
   - **Linux:** Run the `.AppImage` or install the `.deb` package, then launch from your applications menu or terminal.

2. **Default playlists:**  
   On first launch, several preset IPTV playlists will load automatically.

3. **Add a new playlist:**  
   - Enter a playlist URL in the input field and click "Add URL".
   - Or click "Open Local Files" to select M3U/M3U8 files from your device.

4. **Browse and play channels:**  
   - Browse channels by category in the sidebar.
   - Use the search field to filter channels by name.
   - Click any channel to start playback.

5. **Theme toggle:**  
   - Switch between dark and light mode using the button in the header.

**Note:**  
- On macOS, if you encounter a security warning when opening the app, right-click the `.app` and select "Open" to bypass Gatekeeper for unsigned apps.
- On Linux, you may need to give execute permission to the `.AppImage` file:
  ```bash
  chmod +x CrossPlay-IPTV.AppImage
  ```

## Default Playlists

The application includes the following default playlists:
- IPTV.org - MoveOnJoy US Channels
- TVPass.org Playlist
- IPTV.org - TheTVApp US Channels
- IPTV.org - TVPass US Channels
- IPTV.org - US Local Channels
- IPTV.org - US Channels
- GitHub IPTV Big List

