import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.VERCEL
  ? path.join('/tmp', 'cv_optimizer.db')
  : path.resolve(process.cwd(), 'cv_optimizer.db');

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    master_profile TEXT, -- JSON string of profile details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cv_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    job_description TEXT,
    optimized_cv TEXT,
    template_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

export default db;
