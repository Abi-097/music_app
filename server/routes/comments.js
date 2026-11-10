import { Router } from 'express';
import Comment from '../models/Comment.js';
import Track from '../models/Track.js';
import Playlist from '../models/Playlist.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = Router();
const TYPES = ['track', 'playlist'];

// Confirms the target exists and, for playlists, that the viewer is allowed to see it.
const checkTarget = async (type, id, user, res) => {
  if (!TYPES.includes(type)) {
    res.status(400).json({ message: 'Comments are only supported on tracks and playlists' });
    return false;
  }
  if (type === 'track') {
    if (!(await Track.exists({ _id: id }))) {
      res.status(404).json({ message: 'Track not found' });
      return false;
    }
    return true;
  }
  const pl = await Playlist.findById(id).select('owner isPublic').lean();
  if (!pl) {
    res.status(404).json({ message: 'Playlist not found' });
    return false;
  }
  if (!pl.isPublic && String(pl.owner) !== String(user?._id)) {
    res.status(403).json({ message: 'This playlist is private' });
    return false;
  }
  return true;
};

router.get(
  '/:type/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    if (!(await checkTarget(type, id, req.user, res))) return;

    const comments = await Comment.find({ targetType: type, targetId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('user', 'name')
      .lean();
    res.json(comments);
  })
);

router.post(
  '/:type/:id',
  protect,
  asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    if (!(await checkTarget(type, id, req.user, res))) return;

    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });
    if (text.length > 500) return res.status(400).json({ message: 'Comment is too long (500 characters max)' });

    const comment = await Comment.create({ user: req.user._id, targetType: type, targetId: id, text });
    res.status(201).json({
      ...comment.toObject(),
      user: { _id: req.user._id, name: req.user.name },
    });
  })
);

router.delete(
  '/:commentId',
  protect,
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (!comment.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  })
);

export default router;
