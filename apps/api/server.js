const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const prisma = new PrismaClient();
const app = express();

const frontendUrls = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (frontendUrls.includes(origin)) return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      callback(new Error('CORS policy: origin not allowed'));
    },
    credentials: true,
  }),
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ message: 'Your account is temporarily locked. Please try again later.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const failedLoginCount = (user.failedLoginCount || 0) + 1;
      const isLocked = failedLoginCount >= 3;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount,
          lockedUntil: isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });

      const message = isLocked
        ? 'Your account has been temporarily locked. Please try again after 15 minutes.'
        : 'Email or password is incorrect.';
      return res.status(isLocked ? 403 : 401).json({ message });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    );

    res.json({ accessToken: token, requiresMfa: !!user.mfaEnabled });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const port = parseInt(process.env.PORT || '3001', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`Pro-Insight 360 API listening on port ${port}`);
});
