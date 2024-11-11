// server/middleware/auth.js

const jwt = require('jsonwebtoken');

/**
 * Middleware untuk autentikasi JWT dan otorisasi berdasarkan peran.
 * @param {Array|string} roles - Peran yang diizinkan untuk mengakses rute. Bisa berupa string atau array.
 */
const authenticateToken = (roles = []) => {
  // Pastikan roles adalah array
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access Token Required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('JWT verification failed:', err);
        return res.status(403).json({ message: 'Invalid Access Token' });
      }

      req.user = user;

      // Jika roles ditentukan, periksa apakah pengguna memiliki salah satu peran yang diizinkan
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient rights' });
      }

      next();
    });
  };
};

module.exports = authenticateToken;
