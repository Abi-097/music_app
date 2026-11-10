import { Router } from 'express';
import { Readable } from 'stream';
import Track from '../models/Track.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { serializeTrack, escapeRegex } from '../utils/serialize.js';

const router = Router();

const SEARCH_FIELDS = ['title', 'artist', 'album', 'movie'];
const SORTS = {
  popular: { plays: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  title: { title: 1 },
};

// GET /api/tracks?q=&field=all|title|artist|album|movie&genre=&sort=popular|newest|title&page=&limit=
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const field = String(req.query.field || 'all');
    const genre = String(req.query.genre || '').trim();
    const sort = SORTS[req.query.sort] || SORTS.popular;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

    const filter = {};
    if (genre) filter.genre = new RegExp(`^${escapeRegex(genre)}$`, 'i');
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      const fields = SEARCH_FIELDS.includes(field) ? [field] : SEARCH_FIELDS;
      filter.$or = fields.map((f) => ({ [f]: rx }));
    }

    const [items, total] = await Promise.all([
      Track.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Track.countDocuments(filter),
    ]);

    res.json({
      tracks: items.map((t) => serializeTrack(t, req.user?._id)),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  })
);

// GET /api/tracks/genres -> [{ name, count }]
router.get(
  '/genres',
  asyncHandler(async (req, res) => {
    const rows = await Track.aggregate([
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);
    res.json(rows.map((r) => ({ name: r._id, count: r.count })));
  })
);

// GET /api/tracks/recommended
// Uses the user's chosen genres plus the genres of tracks they have liked; falls back to popular tracks.
router.get(
  '/recommended',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const uid = req.user?._id;
    const wanted = 18;
    let genres = [...(req.user?.preferredGenres || [])];

    if (uid) {
      const liked = await Track.find({ likes: uid }).select('genre').lean();
      genres.push(...liked.map((t) => t.genre));
    }
    genres = [...new Set(genres)];

    let tracks = [];
    if (genres.length) {
      const filter = { genre: { $in: genres } };
      if (uid) filter.likes = { $ne: uid };
      tracks = await Track.find(filter).sort({ plays: -1 }).limit(wanted).lean();
    }
    if (tracks.length < wanted) {
      const have = tracks.map((t) => t._id);
      const extra = await Track.find({ _id: { $nin: have } })
        .sort({ plays: -1 })
        .limit(wanted - tracks.length)
        .lean();
      tracks = tracks.concat(extra);
    }

    res.json({ tracks: tracks.map((t) => serializeTrack(t, uid)), basedOn: genres });
  })
);

router.get(
  '/trending',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const tracks = await Track.find().sort({ plays: -1, createdAt: -1 }).limit(10).lean();
    res.json({ tracks: tracks.map((t) => serializeTrack(t, req.user?._id)) });
  })
);

router.get(
  '/liked',
  protect,
  asyncHandler(async (req, res) => {
    const tracks = await Track.find({ likes: req.user._id }).sort({ updatedAt: -1 }).lean();
    res.json({ tracks: tracks.map((t) => serializeTrack(t, req.user._id)) });
  })
);

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const track = await Track.findById(req.params.id).lean();
    if (!track) return res.status(404).json({ message: 'Track not found' });
    res.json(serializeTrack(track, req.user?._id));
  })
);

router.post(
  '/:id/like',
  protect,
  asyncHandler(async (req, res) => {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ message: 'Track not found' });

    const already = track.likes.some((id) => id.equals(req.user._id));
    if (already) track.likes.pull(req.user._id);
    else track.likes.push(req.user._id);
    await track.save();

    res.json({ liked: !already, likesCount: track.likes.length });
  })
);

router.post(
  '/:id/play',
  asyncHandler(async (req, res) => {
    await Track.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } });
    res.sendStatus(204);
  })
);

// GET /api/tracks/:id/download  (login required) - streams the audio file as an attachment
router.get(
  '/:id/download',
  protect,
  asyncHandler(async (req, res) => {
    const track = await Track.findById(req.params.id).lean();
    if (!track) return res.status(404).json({ message: 'Track not found' });

    const upstream = await fetch(track.audioUrl);
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ message: 'Could not fetch the audio file' });
    }

    const safeName = `${track.artist} - ${track.title}`.replace(/[^\w\s.-]/g, '').trim() || 'track';
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
    const length = upstream.headers.get('content-length');
    if (length) res.setHeader('Content-Length', length);
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.mp3"`);

    Readable.fromWeb(upstream.body).pipe(res);
  })
);

export default router;
