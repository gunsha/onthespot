# OnTheSpot - Python to TypeScript/Bun Migration

## Project Overview

Music/video downloader supporting multiple streaming services (Spotify, Tidal, Deezer, YouTube Music, SoundCloud, etc.). Migrating from Python/PyQt6 to TypeScript using Bun as a framework with Web UI.

## Migration Constraints

- new version is on ./bun and the code under src folder
- Use Bun as runtime (native fetch, no external HTTP library needed)
- Always use Bun native APIs (e.g. Bun.file, Bun.write, Bun.CryptoHasher) and avoid Node imports (node:fs, node:path, etc.) where possible.
- Minimal dependencies - prefer stdlib + small utilities
- No Qt UI - Web UI only (future phase)
- Start with API migration, then build upward

---

## Phase 1: Core Infrastructure (Completed)

### 1.1 Shared Types & Interfaces (Completed)

Create `src/types/`:

- `service.ts` - Service enum, common interfaces
- `account.ts` - Account types for each service
- `track.ts` - Track/search result interfaces

### 1.2 Config System (Completed)

Port `otsconfig.py` → `src/config/index.ts`

- JSON config file management
- Default template values
- Path resolution (config dir, cache dir)
- FFMPEG path detection

### 1.3 Logger System (Completed)

Port `runtimedata.py` → `src/logger/index.ts`

- Rotating file handler
- Console output
- Log levels

### 1.4 HTTP Utility (Completed)

Port `utils.py:make_call` → `src/http/client.ts`

- Request caching (MD5 hash of URL)
- Native `fetch` (Bun)
- Optional session management

### 1.5 Utility Functions (Completed)

Port key utils from `utils.py`:

- `sanitize_data()` - path sanitization
- `conv_list_format()` - list formatting
- `format_item_path()` - path template formatting

---

## Phase 2: API Services (Priority Order)

### 2.1 Generic/YouTube Music (Simplest)

Start with `api/generic.py` + `api/youtube_music.py`:

- Uses yt-dlp (can invoke via subprocess initially)
- No auth required for YouTube

### 2.2 Tidal

`api/tidal.py`:

- OAuth device flow authentication
- Multiple endpoints (search, track, album, playlist)
- Base64-encoded credentials

### 2.3 Deezer

`api/deezer.py`:

- ARL token authentication
- Encryption logic (AES, Blowfish)
- Script extraction from HTML

### 2.4 Spotify

`api/spotify.py`:

- Most complex - uses librespot for audio
- Zeroconf login flow
- Token management
- Lyrics fetching (different endpoint)

### 2.5 Other Services

- Apple Music (Completed)
  - Auth, Metadata, Search, Lyrics (Regex), DRM Extraction (via `node-widevine`)
- SoundCloud (Future)
- Qobuz (Future)
- Bandcamp (Future)
- Crunchyroll (Future)

---

## Phase 3: Service Integration

### 3.1 Service Registry

`src/services/index.ts`:

- Unified interface for all services
- Factory pattern for service instances

### 3.2 Account Management

Port `accounts.py` → `src/accounts/`

- Login/logout for each service
- Account pool management
- Token refresh handling

---

## Phase 4: Download & Processing (Future)

### 4.1 Download Queue

Port `downloader.py` → `src/downloader/`

- Queue management
- Worker pools

### 4.2 Metadata Embedding

Port `utils.py` (ffmpeg commands) → `src/metadata/`

- Cover art embedding
- Tag writing via ffmpeg subprocess

---

## Directory Structure

```
bun/
├── src/
│   ├── config/
│   │   └── index.ts          # Config system
│   ├── logger/
│   │   └── index.ts          # Logger
│   ├── http/
│   │   └── client.ts         # HTTP client with cache
│   ├── types/
│   │   ├── service.ts        # Enums & interfaces
│   │   ├── account.ts        # Account types
│   │   └── track.ts          # Track/search types
│   ├── utils/
│   │   ├── path.ts           # Path utilities
│   │   └── format.ts         # Formatting utilities
│   ├── services/
│   │   ├── generic/          # Generic/yt-dlp
│   │   ├── youtube_music/
│   │   ├── tidal/
│   │   ├── deezer/
│   │   ├── spotify/
│   │   └── index.ts          # Service registry
│   ├── accounts/
│   │   └── index.ts          # Account management
│   ├── api/
│   │   └── index.ts          # API entry point
│   └── index.ts              # Main entry
├── package.json
├── tsconfig.json
└── AGENTS.md
```

---

## Dependencies (Minimal)

```json
{
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5"
  }
}
```

No runtime dependencies needed - use Bun's native:

- `fetch` - HTTP requests
- `crypto` - MD5, AES, Blowfish
- `fs` - File operations
- `child_process` - ffmpeg/yt-dlp invocation

---
