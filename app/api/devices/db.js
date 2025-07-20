// db.js
import Database from 'better-sqlite3';

const db = new Database('./devices.db', { verbose: console.log });

// Création de la table si elle n'existe pas
db.exec(`
  CREATE TABLE IF NOT EXISTS devices_status (
    mac TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK(status IN ('allowed', 'blocked')),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
