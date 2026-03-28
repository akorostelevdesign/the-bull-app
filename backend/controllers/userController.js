import bcrypt from 'bcryptjs';
import { dbRun, dbGet, dbAll } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

/**
 * Register new user
 */
export async function register(req, res) {
  try {
    const { name, email, password, role = 'waiter' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await dbRun(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, role]
    );

    const user = await dbGet('SELECT id, name, email, role FROM users WHERE id = ?', [result.id]);
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Login user
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get user profile
 */
export async function getProfile(req, res) {
  try {
    const user = await dbGet('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Update user profile
 */
export async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (!name && !email) {
      return res.status(400).json({ error: 'At least one field required' });
    }

    let sql = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (name) {
      sql += ', name = ?';
      params.push(name);
    }

    if (email) {
      sql += ', email = ?';
      params.push(email);
    }

    sql += ' WHERE id = ?';
    params.push(userId);

    await dbRun(sql, params);

    const user = await dbGet('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(req, res) {
  try {
    const users = await dbAll('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await dbRun('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: err.message });
  }
}
