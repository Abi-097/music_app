import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = Router();

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  preferredGenres: u.preferredGenres,
  settings: {
    quality: u.settings?.quality ?? 'high',
    playbackRate: u.settings?.playbackRate ?? 1,
    autoplay: u.settings?.autoplay ?? true,
  },
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: 'That email is already registered' });
    }

    const user = await User.create({ name, email, password });
    res.status(201).json({ token: sign(user._id), user: publicUser(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: sign(user._id), user: publicUser(user) });
  })
);

router.get('/me', protect, (req, res) => res.json(publicUser(req.user)));

router.put(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const { name, preferredGenres, settings } = req.body;
    const user = req.user;

    if (typeof name === 'string' && name.trim()) user.name = name.trim().slice(0, 60);

    if (Array.isArray(preferredGenres)) {
      user.preferredGenres = [
        ...new Set(
          preferredGenres
            .filter((g) => typeof g === 'string')
            .map((g) => g.trim())
            .filter(Boolean)
        ),
      ].slice(0, 20);
    }

    if (settings && typeof settings === 'object') {
      if (['low', 'high'].includes(settings.quality)) user.settings.quality = settings.quality;
      const rate = Number(settings.playbackRate);
      if (rate >= 0.5 && rate <= 2) user.settings.playbackRate = rate;
      if (typeof settings.autoplay === 'boolean') user.settings.autoplay = settings.autoplay;
    }

    await user.save();
    res.json(publicUser(user));
  })
);

export default router;
