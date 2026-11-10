# Wavely – MERN Music Streaming App

A full-stack music streaming app built with **MongoDB, Express, React (Vite) and Node.js**, styled with **Tailwind CSS**. Audio playback uses **Howler.js**.

## Features

| Area | What's included |
| --- | --- |
| **Music viewing** | Home page with recommendations (based on your chosen genres + songs you like), genre browsing and trending tracks |
| **Search** | Search by song name, artist, album or movie (or all at once), filter by genre, sort by popularity / newest / A–Z |
| **Playlists** | Create, edit, delete; add or remove songs; public or private; view your library and other users' public playlists |
| **Streaming** | Howler.js streaming player with play/pause, next/previous, seek, shuffle, repeat (off / all / one), volume and mute; lock-screen / media-key support |
| **Playback settings** | Streaming quality (high or data-saver), playback speed (0.75×–2×), autoplay next track. Saved on the device and on your account |
| **Downloads** | Download any track as an MP3 for offline listening |
| **Social** | Like tracks and playlists, comment on tracks and playlists (delete your own), share buttons for Facebook, Twitter and Instagram, plus copy link |
| **Accounts** | Register / login with JWT, hashed passwords (bcrypt) |

## Project structure

```
music-streaming-app/
├── server/                 Express + MongoDB API
│   ├── config/db.js
│   ├── middleware/         auth (JWT), asyncHandler
│   ├── models/             User, Track, Playlist, Comment
│   ├── routes/             auth, tracks, playlists, comments
│   ├── utils/serialize.js
│   ├── seed.js             loads demo tracks
│   └── server.js
└── client/                 React + Vite + Tailwind
    └── src/
        ├── context/        AuthContext, PlayerContext (Howler)
        ├── components/     Player, TrackRow, TrackCard, ShareButtons, CommentSection, ...
        ├── pages/          Home, Search, Library, PlaylistDetail, TrackDetail, Liked, Settings, Login, Register
        └── lib/            api (axios), format helpers
```

## Setup

Requires **Node.js 18 or newer**.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Open `server/.env` and set:

- `MONGODB_URI`: your MongoDB Atlas connection string, with your own user and password and a database name (for example `/wavely`) before the `?`.
- `JWT_SECRET`: any long random string.

In MongoDB Atlas, go to **Network Access** and make sure your current IP address is allowed, otherwise the connection will time out.

Then load the demo music and start the API:

```bash
npm run seed      # inserts 25 demo tracks (this clears existing tracks first)
npm run dev       # API on http://localhost:5000
```

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev       # app on http://localhost:5173
```

In development Vite forwards `/api` requests to `http://localhost:5000`, so no extra config is needed. Open http://localhost:5173, sign up, pick your favourite genres in Settings, and start listening.

## About the demo music

`npm run seed` creates made-up track titles, artists, albums and movies, and points them at free sample songs from [SoundHelix](https://www.soundhelix.com) and placeholder cover art from picsum.photos. To use your own catalogue, insert documents into the `tracks` collection (or edit `seed.js`) with:

```
title, artist, album, movie, genre, audioUrl, coverUrl
audioUrlLow   (optional lower-bitrate file used by the "data saver" setting)
```

Only stream and offer for download audio you have the rights to.

## API overview

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | returns `{ token, user }` |
| GET / PUT | `/api/auth/me` | profile, preferred genres, playback settings |
| GET | `/api/tracks?q=&field=&genre=&sort=&page=&limit=` | search / browse |
| GET | `/api/tracks/recommended`, `/trending`, `/genres`, `/liked` | |
| GET | `/api/tracks/:id` | |
| POST | `/api/tracks/:id/like`, `/api/tracks/:id/play` | like toggles |
| GET | `/api/tracks/:id/download` | login required, streams MP3 attachment |
| GET / POST | `/api/playlists`, `/api/playlists/public` | |
| GET / PUT / DELETE | `/api/playlists/:id` | |
| POST / DELETE | `/api/playlists/:id/tracks[/:trackId]` | add / remove a song |
| POST | `/api/playlists/:id/like` | |
| GET / POST | `/api/comments/:type/:id` | `type` is `track` or `playlist` |
| DELETE | `/api/comments/:commentId` | own comments only |

## Production build

```bash
cd client && npm run build       # outputs client/dist
```

Host `client/dist` on any static host, deploy `server/` to a Node host, set `CLIENT_URL` on the server to the site's URL, and set `VITE_API_URL` (for example `https://your-api.example.com/api`) when building the client.

## Notes

- The Instagram button copies the link and opens Instagram, because Instagram has no public web share link. Facebook and Twitter open their share dialogs directly. (Shared links only work for others once the app is deployed to a public URL.)
- Downloads are saved as MP3 files on the device; there is no in-app offline library yet.
- Never commit `server/.env`. It is already listed in `.gitignore`.
