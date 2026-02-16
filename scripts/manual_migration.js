const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    console.log('Attempting to add related_area_ids column to notes table...');
    db.prepare('ALTER TABLE notes ADD COLUMN related_area_ids TEXT').run();
    console.log('Success: Column added.');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('Column already exists.');
    } else {
        console.error('Error adding column:', error);
    }
}
