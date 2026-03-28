import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { verifyToken, verifyAdmin, verifyManager } from './middleware/auth.js';

// Controllers
import * as userController from './controllers/userController.js';
import * as learningController from './controllers/learningController.js';
import * as promoController from './controllers/promoController.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── AUTH ROUTES ───
app.post('/api/auth/register', userController.register);
app.post('/api/auth/login', userController.login);

// ─── USER ROUTES ───
app.get('/api/users/profile', verifyToken, userController.getProfile);
app.put('/api/users/profile', verifyToken, userController.updateProfile);
app.get('/api/users', verifyToken, verifyAdmin, userController.getAllUsers);
app.delete('/api/users/:userId', verifyToken, verifyAdmin, userController.deleteUser);

// ─── LEARNING ROUTES ───
app.post('/api/learning/progress', verifyToken, learningController.saveProgress);
app.get('/api/learning/progress', verifyToken, learningController.getProgress);
app.get('/api/learning/progress/all', verifyToken, verifyManager, learningController.getAllProgress);
app.delete('/api/learning/progress/:userId', verifyToken, verifyManager, learningController.resetProgress);

// ─── PROMO CODE ROUTES ───
app.post('/api/promo/create', verifyToken, verifyAdmin, promoController.createPromoCode);
app.post('/api/promo/redeem', verifyToken, promoController.redeemPromoCode);
app.get('/api/promo/codes', verifyToken, promoController.getUserPromoCodes);
app.get('/api/promo/codes/all', verifyToken, verifyAdmin, promoController.getAllPromoCodes);
app.delete('/api/promo/codes/:codeId', verifyToken, verifyAdmin, promoController.deletePromoCode);

// ─── ERROR HANDLING ───
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── START SERVER ───
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`📚 Learning API ready`);
      console.log(`🔐 Auth endpoints available`);
      console.log(`\n📖 API Documentation:`);
      console.log(`  POST   /api/auth/register - Register new user`);
      console.log(`  POST   /api/auth/login - Login user`);
      console.log(`  GET    /api/users/profile - Get user profile`);
      console.log(`  PUT    /api/users/profile - Update profile`);
      console.log(`  POST   /api/learning/progress - Save learning progress`);
      console.log(`  GET    /api/learning/progress - Get user progress`);
      console.log(`  POST   /api/promo/redeem - Redeem promo code`);
      console.log(`  GET    /api/promo/codes - Get user promo codes\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
