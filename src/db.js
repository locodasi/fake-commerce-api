const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }

  // Enable foreign key constraints
  db.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
    if (pragmaErr) {
      console.error('Failed to enable foreign keys:', pragmaErr.message);
    } else {
      console.log('Foreign key constraints are enabled.');
    }
  });
});

module.exports = db;
