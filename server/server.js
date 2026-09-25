const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const problemRoutes = require('./routes/problemRoutes');
const authRoutes = require('./routes/authRoutes');
const answerRoutes = require('./routes/answerRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const replyRoutes = require('./routes/replyRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// Allowed Origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'https://problempool.onrender.com',
  'https://problem-pool-oa2s608ty-tejaswis-projects-fd59992e.vercel.app',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (like curl, postman, server-to-server)
    if (!origin) return callback(null, true);

    try {
      const originUrl = new URL(origin);
      const hostname = originUrl.hostname;

      // Allow localhost / 127.0.0.1
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return callback(null, true);
      }

      // Allow all Vercel deployment domains (*.vercel.app)
      if (hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // Allow all Render deployment domains (*.onrender.com)
      if (hostname.endsWith('.onrender.com')) {
        return callback(null, true);
      }

      // Allow explicitly defined origins in environment
      if (
        (process.env.CLIENT_URL && origin === process.env.CLIENT_URL.replace(/\/+$/, '')) ||
        (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL.replace(/\/+$/, '')) ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
    } catch {
      // If URL parsing fails, proceed to fallback check
    }

    // Default: allow origin for smooth production and staging cross-origin communication
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
};

// Middlewares
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/replies', replyRoutes);

// Health check endpoints for root and /api (used by uptime monitors & hosting platforms)
app.get(['/', '/api'], (req, res) => {
  res.json({
    success: true,
    message: 'ProblemPool API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
