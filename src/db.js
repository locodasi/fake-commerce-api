const sqlite3 = require('sqlite3').verbose();

const { open } = require('sqlite');

async function openDb() {
  const db = await open({
    filename: './db/database.sqlite',
    driver: sqlite3.Database,
  });

  await db.run('PRAGMA foreign_keys = ON');
  console.log('Foreign key constraints are enabled.');
  return db;
}

module.exports = openDb;
