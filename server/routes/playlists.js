import { Router } from 'express';
import Playlist from '../models/Playlist.js';
import Track from '../models/Track.js';
import Comment from '../models/Comment.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { serializeTrack } from '../utils/serialize.js';

const router = Router();

// Compact shape used in lists (no full track data).
const summarize = (pl) => ({
  _id: pl._id,
  name: pl.name,
  description: pl.description,
  isPublic: pl.isPublic,
  owner: pl.owner,
  trackCount: pl.tracks.length,
  covers: pl.tracks.map((t) => t.coverUrl).filter(Boolean).slice(0, 4),
  likesCount: pl.likes.length,
});

const isOwner = (pl, user) => !!user && String(pl.owner) === String(user._id);

// Loads a playlist the signed-in user owns, or sends the right error.
const ownedPlaylist = async (req, res) => {
  const pl = await Playlist.findById(req.params.id);
  if (!pl) {
    res.status(404).json({ message: 'Playlist not found' });
    return null;
  }
  if (!isOwner(pl, req.user)) {
    res.status(403).json({ message: 'You can only change your own playlists' });
    return null;
  }
  return pl;
};

// GET /api/playlists -> the signed-in user's playlists
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const lists = await Playlist.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .populate({ path: 'tracks', select: 'coverUrl' })
      .lean();
    res.json(lists.map((pl) => summarize({ ...pl, owner: { _id: req.user._id, name: req.user.name } })));
  })
);

// GET /api/playlists/public -> latest public playlists from everyone
router.get(
  '/public',
  asyncHandler(async (req, res) => {
    const lists = await Playlist.find({ isPublic: true })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('owner', 'name')
      .populate({ path: 'tracks', select: 'coverUrl' })
      .lean();
    res.json(lists.map(summarize));
  })
);

router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Playlist name is required' });

    const pl = await Playlist.create({
      name: name.slice(0, 80),
      description: String(req.body.description || '').trim().slice(0, 300),
      isPublic: !!req.body.isPublic,
      owner: req.user._id,
    });
    res.status(201).json({ _id: pl._id, name: pl.name });
  })
);

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const pl = await Playlist.findById(req.params.id)
      .populate('owner', 'name')
      .populate('tracks')
      .lean();
    if (!pl) return res.status(404).json({ message: 'Playlist not found' });

    const uid = req.user?._id;
    const owner = !!uid && String(pl.owner._id) === String(uid);
    if (!pl.isPublic && !owner) {
      return res.status(403).json({ message: 'This playlist is private' });
    }

    res.json({
      _id: pl._id,
      name: pl.name,
      description: pl.description,
      isPublic: pl.isPublic,
      owner: pl.owner,
      isOwner: owner,
      createdAt: pl.createdAt,
      tracks: pl.tracks.map((t) => serializeTrack(t, uid)),
      likesCount: pl.likes.length,
      liked: uid ? pl.likes.some((id) => String(id) === String(uid)) : false,
    });
  })
);

router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const pl = await ownedPlaylist(req, res);
    if (!pl) return;

    if (typeof req.body.name === 'string' && req.body.name.trim()) pl.name = req.body.name.trim().slice(0, 80);
    if (typeof req.body.description === 'string') pl.description = req.body.description.trim().slice(0, 300);
    if (typeof req.body.isPublic === 'boolean') pl.isPublic = req.body.isPublic;
    await pl.save();

    res.json({ name: pl.name, description: pl.description, isPublic: pl.isPublic });
  })
);

router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const pl = await ownedPlaylist(req, res);
    if (!pl) return;
    await Promise.all([
      pl.deleteOne(),
      Comment.deleteMany({ targetType: 'playlist', targetId: pl._id }),
    ]);
    res.json({ message: 'Playlist deleted' });
  })
);

// POST /api/playlists/:id/tracks  { trackId }
router.post(
  '/:id/tracks',
  protect,
  asyncHandler(async (req, res) => {
    const pl = await ownedPlaylist(req, res);
    if (!pl) return;

    const trackExists = await Track.exists({ _id: req.body.trackId });
    if (!trackExists) return res.status(404).json({ message: 'Track not found' });

    await Playlist.updateOne({ _id: pl._id }, { $addToSet: { tracks: req.body.trackId } });
    const fresh = await Playlist.findById(pl._id).select('tracks').lean();
    res.json({ trackCount: fresh.tracks.length });
  })
);

router.delete(
  '/:id/tracks/:trackId',
  protect,
  asyncHandler(async (req, res) => {
    const pl = await ownedPlaylist(req, res);
    if (!pl) return;
    await Playlist.updateOne({ _id: pl._id }, { $pull: { tracks: req.params.trackId } });
    res.json({ message: 'Track removed' });
  })
);

router.post(
  '/:id/like',
  protect,
  asyncHandler(async (req, res) => {
    const pl = await Playlist.findById(req.params.id);
    if (!pl) return res.status(404).json({ message: 'Playlist not found' });
    if (!pl.isPublic && !isOwner(pl, req.user)) {
      return res.status(403).json({ message: 'This playlist is private' });
    }

    const already = pl.likes.some((id) => id.equals(req.user._id));
    if (already) pl.likes.pull(req.user._id);
    else pl.likes.push(req.user._id);
    await pl.save();

    res.json({ liked: !already, likesCount: pl.likes.length });
  })
);

export default router;
