import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, '../data/app.db');

// In-memory database for demo/testing
// In production, integrate with a proper SQLite driver
const database = {
  users: [],
  learningProgress: [],
  promoCodes: [],
  subscriptions: [],
};

let nextUserId = 1;
let nextProgressId = 1;
let nextPromoId = 1;
let nextSubId = 1;

/**
 * Initialize database schema (simulated)
 */
export async function initializeDatabase() {
  console.log('Database initialized (in-memory storage)');
  return Promise.resolve();
}

/**
 * Run a database query (simulated)
 */
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      // Simulated INSERT
      if (sql.includes('INSERT INTO users')) {
        const [name, email, hashedPassword, role] = params;
        const user = {
          id: nextUserId++,
          name,
          email,
          password_hash: hashedPassword,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        database.users.push(user);
        resolve({ id: user.id, changes: 1 });
      } else if (sql.includes('INSERT INTO learning_progress')) {
        const [userId, moduleId, score] = params;
        const progress = {
          id: nextProgressId++,
          user_id: userId,
          module_id: moduleId,
          score,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        database.learningProgress.push(progress);
        resolve({ id: progress.id, changes: 1 });
      } else if (sql.includes('INSERT INTO promo_codes')) {
        const [code, userId, type, expiresAt] = params;
        const promo = {
          id: nextPromoId++,
          code,
          user_id: userId,
          type,
          used: false,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        };
        database.promoCodes.push(promo);
        resolve({ id: promo.id, changes: 1 });
      } else if (sql.includes('UPDATE')) {
        resolve({ changes: 1 });
      } else if (sql.includes('DELETE')) {
        resolve({ changes: 1 });
      } else {
        resolve({ changes: 0 });
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Get a single row from database
 */
export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      // SELECT from users by email
      if (sql.includes('SELECT * FROM users WHERE email')) {
        const user = database.users.find(u => u.email === params[0]);
        resolve(user || null);
      }
      // SELECT from users by id
      else if (sql.includes('SELECT id, name, email, role FROM users WHERE id')) {
        const user = database.users.find(u => u.id === params[0]);
        if (user) {
          resolve({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          });
        } else {
          resolve(null);
        }
      }
      // SELECT learning progress
      else if (sql.includes('SELECT * FROM learning_progress WHERE user_id')) {
        const progress = database.learningProgress.find(
          p => p.user_id === params[0] && p.module_id === params[1]
        );
        resolve(progress || null);
      }
      // SELECT promo code
      else if (sql.includes('SELECT * FROM promo_codes WHERE code')) {
        const promo = database.promoCodes.find(p => p.code === params[0]);
        resolve(promo || null);
      } else {
        resolve(null);
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Get all rows from database
 */
export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      // SELECT all users
      if (sql.includes('SELECT id, name, email, role, created_at FROM users')) {
        const users = database.users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          created_at: u.created_at,
        }));
        resolve(users);
      }
      // SELECT all learning progress for user
      else if (sql.includes('SELECT * FROM learning_progress WHERE user_id')) {
        const progress = database.learningProgress.filter(p => p.user_id === params[0]);
        resolve(progress);
      }
      // SELECT all promo codes
      else if (sql.includes('SELECT id, code, type, used, expires_at, created_at FROM promo_codes')) {
        const codes = database.promoCodes.map(p => ({
          id: p.id,
          code: p.code,
          type: p.type,
          used: p.used,
          expires_at: p.expires_at,
          created_at: p.created_at,
        }));
        resolve(codes);
      } else {
        resolve([]);
      }
    } catch (err) {
      reject(err);
    }
  });
}

export default database;
