const Database = require('better-sqlite3');
const db = new Database('sqlite.db');
try {
  db.prepare('ALTER TABLE notes ADD COLUMN audio_url text').run();
  console.log('Migration successful: Added audio_url to notes table');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
     console.log('Column audio_url already exists');
  } else {
     console.error('Migration failed:', e);
  }
}
