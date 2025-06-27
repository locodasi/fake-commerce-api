const db = require('../db');
const { ClientError, ServerError } = require('../errors');
const { withDbErrorHandling } = require('../decoratores');

/**
 * Inserts a record into the indicated table, simulated (with ROLLBACK).
 * @param {string} tableName - Table name.
 * @param {object} data - Object with the fields to be inserted.
 * @returns {Promise<object>} - Result with inserted object or error.
 */
const insertToTable = withDbErrorHandling((tableName, data, done) => {
    const keys = Object.keys(data);
    const values = Object.values(data);

    if (keys.length === 0) {
        return done(new ClientError('No fields were passed to insert.'));
    }

    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run(sql, values, function (err) {
        if (err) {
          db.run('ROLLBACK');
          return done(parseSqliteError(err));
        }
      
        const insertedId = this.lastID;
      
        // Hacemos SELECT para obtener el registro completo
        db.get('SELECT * FROM users WHERE id = ?', [insertedId], (selectErr, row) => {
          if (selectErr) {
            db.run('ROLLBACK');
            return done(parseSqliteError(selectErr));
          }
      
          db.run('ROLLBACK', (rollbackErr) => {
            if (rollbackErr) {
              return done(parseSqliteError(selectErr));
            }
      
            return done(null, row); // Aquí devolvemos el registro completo
          });
        });
      });
    });
})

/**
 * Fetches data from a given table with optional column selection and row limit.
 * @param {string} tableName - Name of the table to query.
 * @param {string[]} [columns=['*']] - List of column names to retrieve.
 * @param {number} [limit] - Optional maximum number of rows to return.
 * @returns {Promise<object[]>} - Resolves with an array of rows from the database.
 */
const getData = withDbErrorHandling((tableName, columns = ['*'], limit, done) => {
    if (typeof tableName !== 'string' || !tableName.trim()) {
      return done(new ClientError('Invalid table name.'));
    }

    if (!Array.isArray(columns) || columns.length === 0) {
      columns = ['*'];
    }

    // Escape column and table names (SQLite does not support parameterized identifiers)
    const columnsSql = columns.map(sanitizeIdentifier).join(', ');

    let sql = `SELECT ${columnsSql} FROM ${tableName}`;
    if (limit && Number.isInteger(limit) && limit > 0) {
      sql += ` LIMIT ${limit}`;
    }

    db.all(sql, [], (err, rows) => {
      if (err) {
        return done(parseSqliteError(err));
      }
      done(null, rows);
    });
});

/**
 * Fetches one row from a given table with optional column selection.
 * @param {string} tableName - Name of the table to query.
 * @param {number} id - The id.
 * @param {string[]} [columns=['*']] - List of column names to retrieve.
 * @returns {Promise<object[]>} - Resolves with an array of rows from the database.
 */
const getDataById = withDbErrorHandling((tableName, id, columns = ['*'], done) => {
  if (typeof tableName !== 'string' || !tableName.trim()) {
    return done(new ClientError('Invalid table name.'));
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    columns = ['*'];
  }

  // Escape column and table names (SQLite does not support parameterized identifiers)
  const columnsSql = columns.map(sanitizeIdentifier).join(', ');

  let sql = `SELECT ${columnsSql} FROM ${tableName} WHERE id = ${id}`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return done(parseSqliteError(err));
    }
    done(null, rows[0]);
  });
});

/**
 * Update a row.
 * @param {string} tableName - Name of the table to query.
 * @param {number} id - The id.
 * @param {Object} newRow - The changes.
 * @returns {Promise<object[]>} - Resolves with an array of rows from the database.
 */
const updateData = withDbErrorHandling((tableName, id, newRow, done) => {
  if (typeof tableName !== 'string' || !tableName.trim()) {
    return done(new ClientError('Invalid table name.'));
  }

  const keys = Object.keys(newRow);
  if (keys.length === 0) {
    throw new ClientError('No data to update');
  }

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const values = keys.map(key => newRow[key]);

  const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;

  values.push(id);

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(sql, values, function (err) {
      if (err) {
        db.run('ROLLBACK');
        return done(parseSqliteError(err));
      }
    
      if (this.changes === 0) {
        db.run('ROLLBACK');
        return done(new ClientError('User not found or nothing changed'));
      }
    
      db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id], (selectErr, row) => {
        if (selectErr) {
          db.run('ROLLBACK');
          return done(parseSqliteError(selectErr));
        }
    
        db.run('ROLLBACK', (rollbackErr) => {
          if (rollbackErr) {
            return done(parseSqliteError(rollbackErr));
          }
    
          return done(null, row); // Aquí devolvemos el registro completo
        });
      });
    });
  });
});

/**
 * Simulates toggling a boolean field (e.g., active) on a given row in a table.
 * The change is rolled back — useful for dry-run/testing.
 *
 * @param {string} tableName - Name of the table.
 * @param {number} id - ID of the row to modify.
 * @param {string} columnName - Name of the boolean column to toggle (0 <-> 1).
 * @returns {Promise<object>} - Resolves with the modified row (not committed).
 */
const toggleBooleanField = withDbErrorHandling((tableName, id, columnName, done) => {
  if (typeof tableName !== 'string' || !tableName.trim()) {
    return done(new ClientError('Invalid table name.'));
  }

  if (typeof columnName !== 'string' || !columnName.trim()) {
    return done(new ClientError('Invalid column name.'));
  }

  const toggleSql = `UPDATE ${tableName} SET ${columnName} = CASE ${columnName} WHEN 1 THEN 0 ELSE 1 END WHERE id = ?`;
  const selectSql = `SELECT * FROM ${tableName} WHERE id = ?`;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(toggleSql, [id], function (err) {
      if (err) {
        return db.run('ROLLBACK', () => done(parseSqliteError(err)));
      }

      if (this.changes === 0) {
        return db.run('ROLLBACK', () => done(new ClientError('Record not found or no change applied')));
      }

      db.get(selectSql, [id], (selectErr, row) => {
        if (selectErr) {
          return db.run('ROLLBACK', () => done(parseSqliteError(selectErr)));
        }

        db.run('ROLLBACK', (rollbackErr) => {
          if (rollbackErr) {
            return done(parseSqliteError(rollbackErr));
          }

          return done(null, row); // Devolvemos el estado invertido (simulado)
        });
      });
    });
  });
});

/**
 * Simulates deleting a row by ID from a given table.
 * The change is rolled back — useful for dry-run/testing.
 *
 * @param {string} tableName - Name of the table.
 * @param {number} id - ID of the row to delete.
 * @returns {Promise<object>} - Resolves with the row that would have been deleted (not committed).
 */
const deleteRowById = withDbErrorHandling((tableName, id, done) => {
  if (typeof tableName !== 'string' || !tableName.trim()) {
    return done(new ClientError('Invalid table name.'));
  }

  const deleteSql = `DELETE FROM ${tableName} WHERE id = ?`;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(deleteSql, [id], function (deleteErr) {
      if (deleteErr) {
        return db.run('ROLLBACK', () => done(parseSqliteError(deleteErr)));
      }

      db.run('ROLLBACK', (rollbackErr) => {
        if (rollbackErr) {
          return done(parseSqliteError(rollbackErr));
        }

        return done(null, {id}); // Devolvemos el registro "borrado" (simulado)
      });
    });
  });
});



// Analize the commons errors in SQLite
function parseSqliteError(err) {
    const msg = err.message;
    // UNIQUE constraint
    const uniqueMatch = msg.match(/UNIQUE constraint failed: (\w+)\.(\w+)/);
    if (uniqueMatch) {
      const [, table, column] = uniqueMatch;
      return new ClientError(`The value for column '${column}' in table '${table}' already exists and must be unique.`, msg);
    }
  
    // NOT NULL constraint
    const notNullMatch = msg.match(/NOT NULL constraint failed: (\w+)\.(\w+)/);
    if (notNullMatch) {
      const [, table, column] = notNullMatch;
      return new ClientError(`The column '${column}' in table '${table}' is required and cannot be null.`, msg);
    }
  
    // No such column
    const noSuchColMatch = msg.match(/no such column: (\w+)/);
    if (noSuchColMatch) {
      const [, column] = noSuchColMatch;
      return new ClientError(`The column '${column}' does not exist in the table.`, msg);
    }
  
    // Datatype mismatch (limited info)
    if (msg.includes('datatype mismatch')) {
      return new ClientError('Invalid data type for one or more columns. Please check that the types match the table schema.', msg);
    }
  
    // CHECK constraint failed
    const checkMatch = msg.match(/CHECK constraint failed: (\w+)/);
    if (checkMatch) {
      const [, column] = checkMatch;
      return new ClientError(`The column '${column}' does not satisfy the validation constraint.`, msg);
    }
  
    // No such table
    const noSuchTableMatch = msg.match(/no such table: (\w+)/);
    if (noSuchTableMatch) {
      const [, table] = noSuchTableMatch;
      return new ClientError(`The table '${table}' does not exist in the database.`, msg);
    }
  
    // Default fallback
    //return new ClientError('Database insertion error: ' + msg);
    return new ClientError('Error with database', msg);
}
  
/**
 * Sanitizes a SQL identifier (table or column name) by:
 *  - Removing any single quotes ('), double quotes ("), or backticks (`) that may be present,
 *  - Wrapping the resulting string in double quotes to safely use it in an SQLite query.
 * 
 * This prevents syntax errors or SQL injection via identifier names,
 * assuming the input is intended as a raw column or table name without quotes.
 * 
 * @param {string} name - The raw identifier string to sanitize.
 * @returns {string} - The sanitized identifier safely wrapped in double quotes.
 */
function sanitizeIdentifier(name) {
    if(name === "*") return "*"
    const cleaned = name.replace(/['"`]/g, '');
    return `"${cleaned}"`;
}

  
module.exports = {
  insertToTable,
  getData,
  getDataById,
  updateData,
  toggleBooleanField,
  deleteRowById
};
