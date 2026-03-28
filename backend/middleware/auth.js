import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

/**
 * Verify JWT token middleware
 */
export function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Verify admin role middleware
 */
export function verifyAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Verify manager role middleware
 */
export function verifyManager(req, res, next) {
  if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
}

/**
 * Generate JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
}
