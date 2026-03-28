import { dbRun, dbGet, dbAll } from '../config/database.js';

/**
 * Save or update learning progress for a module
 */
export async function saveProgress(req, res) {
  try {
    const { moduleId, score } = req.body;
    const userId = req.user.id;

    if (!moduleId || score === undefined) {
      return res.status(400).json({ error: 'Module ID and score required' });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({ error: 'Score must be between 0 and 100' });
    }

    // Check if progress exists
    const existing = await dbGet(
      'SELECT id FROM learning_progress WHERE user_id = ? AND module_id = ?',
      [userId, moduleId]
    );

    let result;
    if (existing) {
      // Update existing progress
      result = await dbRun(
        `UPDATE learning_progress 
         SET score = MAX(score, ?), completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND module_id = ?`,
        [score, userId, moduleId]
      );
    } else {
      // Insert new progress
      result = await dbRun(
        `INSERT INTO learning_progress (user_id, module_id, score, completed_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, moduleId, score]
      );
    }

    const progress = await dbGet(
      'SELECT * FROM learning_progress WHERE user_id = ? AND module_id = ?',
      [userId, moduleId]
    );

    res.json({
      message: 'Progress saved successfully',
      progress,
    });
  } catch (err) {
    console.error('Save progress error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get user's learning progress
 */
export async function getProgress(req, res) {
  try {
    const userId = req.user.id;

    const progress = await dbAll(
      'SELECT * FROM learning_progress WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    // Calculate overall progress
    const totalScore = progress.reduce((sum, p) => sum + p.score, 0);
    const avgScore = progress.length > 0 ? Math.round(totalScore / progress.length) : 0;
    const allModulesCompleted = progress.length >= 4 && progress.every(p => p.score >= 80);

    res.json({
      progress,
      summary: {
        avgScore,
        modulesCompleted: progress.length,
        allModulesCompleted,
      },
    });
  } catch (err) {
    console.error('Get progress error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Reset user's learning progress (manager/admin only)
 */
export async function resetProgress(req, res) {
  try {
    const { userId } = req.params;

    await dbRun('DELETE FROM learning_progress WHERE user_id = ?', [userId]);

    res.json({ message: 'Learning progress reset successfully' });
  } catch (err) {
    console.error('Reset progress error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get all users' learning progress (manager/admin only)
 */
export async function getAllProgress(req, res) {
  try {
    const progress = await dbAll(`
      SELECT 
        u.id, u.name, u.email, u.role,
        lp.module_id, lp.score, lp.completed_at
      FROM users u
      LEFT JOIN learning_progress lp ON u.id = lp.user_id
      ORDER BY u.name, lp.module_id
    `);

    // Group by user
    const grouped = {};
    progress.forEach(row => {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          modules: [],
        };
      }
      if (row.module_id) {
        grouped[row.id].modules.push({
          moduleId: row.module_id,
          score: row.score,
          completedAt: row.completed_at,
        });
      }
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error('Get all progress error:', err);
    res.status(500).json({ error: err.message });
  }
}
