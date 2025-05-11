
---

### ✅ `task-list.md`

```markdown
# Agent Task Checklist: CrossPlay IPTV


## 🚀 Project Goals

- Build a cross-platform IPTV player with playlist merging and playback controls
- Use Electron and React (or Vue if preferred)
- Ensure compatibility with Windows, macOS, and Linux

---

## 🧱 Project Setup

- [x] Scaffold project with Vite + Electron + React
- [x] Set up Electron main process
- [x] Add React UI entry (with Vite HMR)
- [x] Install required dependencies: video.js, m3u8-parser

---

## 🎥 Media Player

- [x] Create a `<VideoPlayer />` component using video.js
- [x] Add playback controls (play, pause, seek, rewind, forward, volume)

---

## 📂 Playlist Management

- [x] Create `PlaylistManager` module
- [x] Let user add playlists (via URL or file picker)
- [x] Merge all playlists into a single list using `m3u8-parser`
- [x] Cache merged list locally (JSON or LocalStorage)
- [x] Refresh merged playlist on app load

---

## 🧪 Dev Tools & Testing

- [x] Add test playlists for dev (public/test1.m3u8, test2.m3u8)
- [x] Validate merged playlist rendering
- [x] Validate media playback from merged list

---

## 📦 Packaging & Build

- [x] Add platform-specific build scripts with Electron Builder or Forge
- [x] Build for Windows
- [x] Build for macOS
- [x] Build for Linux

---

## 🧼 Optional Extras

- [x] Add dark/light theme toggle
- [x] Add loading indicators and error messages
- [x] Add search/filter for merged playlist


### ✅ `task-list.md` (Updated with Proxy Support)

```markdown
# Agent Task Checklist: CrossPlay IPTV with Proxy Support

> Updated instructions for Agent Mode in VS Code Insiders

---

## ✅ Project Core

- [x] Scaffold with Electron + React + Vite
- [x] Setup video playback (video.js or native)
- [x] Handle multiple playlists via URL/file
- [x] Merge playlists on app load
- [x] Add basic playback UI
- [x] Cache playlists locally
- [x] Build scripts for Windows/macOS/Linux

---

## 🆕 New: Proxy Mode Support

### 🔁 Proxy Manager

- [ ] Add a `ProxyManager` module or service
- [ ] Create toggle in UI to enable/disable Proxy Mode
- [ ] Use ProxyScrape API to fetch proxy list:
https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=text&timeout=20000

markdown

- [ ] Parse proxy list (protocol, IP, port)

### ✅ Working Proxies

- [ ] Check each proxy (via `fetch` or `axios`) to confirm it's working
- [ ] Keep only working ones — **max 10 proxies**
- [ ] Periodically recheck list and refill if under 10

### 🔐 Proxy Status

- [ ] Create a UI component to show proxy status:
- ✅ Active (proxy used)
- ⚠️ Exposed (real IP being used)
- [ ] Use an IP check API (e.g., `https://api64.ipify.org`) to compare proxy vs real IP
- [ ] Show current IP in footer (real or proxy)
### 📦 Proxy Integration

- [ ] If Proxy Mode is enabled:
- Use working proxies for playlist/stream fetching
- [ ] If disabled:
- Use normal IP, skip proxy logic

---

## 🧪 Testing Tasks

- [ ] Test playlist fetching with proxies
- [ ] Confirm fallback to real IP if proxy fails
- [ ] Ensure proxy pool stays full
- [ ] Test across Windows, macOS, Linux

---

## 🌟 Optional Improvements

- [ ] Show last successful proxy used
- [ ] Add option to refresh proxy pool manually
- [ ] Save proxy mode preference in settings
- [ ] Display current IP (real or proxy) in footer