import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getToken = (req) => {
  const header = req.headers.authorization;
  return header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;
};

// Requires a valid token; attaches req.user.
export const protect = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'Please log in to continue' });
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
};

// Attaches req.user when a valid token is present, but never blocks the request.
export const optionalAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (token) {
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(id);
    }
  } catch {
    /* ignore invalid tokens for public routes */
  }
  next();
};
