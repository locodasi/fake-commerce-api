const { ClientError } = require('../errors');

/**
 * Fetches rows from a table with optional column selection, filtering, and row limiting.
 *
 * @param {string} tableName - Name of the table to query.
 * @param {string[]} [columns=['*']] - Columns to retrieve.
 * @param {Object[]} [filters=[]] - Optional filters: each { column, operator, value }.
 * @param {number} [limit] - Optional limit on number of rows returned.
 * @param {object} db - SQLite database connection.
 * @returns {Promise<object[]>} - Resolves with the resulting rows.
 * @throws {ClientError} - On invalid input or SQLite error.
 */
const rawGetData = async (tableName, columns = ['*'], filters = [], limit, db) => {
  validateString(tableName, 'Invalid table name.')

  if (!Array.isArray(columns) || columns.length === 0) {
    columns = ['*'];
  }

  const allowedOperators = ['=', '!=', '<', '<=', '>', '>=', 'LIKE', 'IN'];
  const columnsSql = columns.map(sanitizeIdentifier).join(', ');

  const whereClauses = [];
  const values = [];

  for (const filter of filters) {
    const { column, operator, value } = filter;

    if (!allowedOperators.includes(operator)) {
      throw new ClientError(`Invalid operator '${operator}' in filter.`);
    }

    const col = sanitizeIdentifier(column);

    if (operator === 'IN' && Array.isArray(value)) {
      const placeholders = value.map(() => '?').join(', ');
      whereClauses.push(`${col} IN (${placeholders})`);
      values.push(...value);
    } else {
      whereClauses.push(`${col} ${operator} ?`);
      values.push(value);
    }
  }

  let sql = `SELECT ${columnsSql} FROM ${tableName}`;

  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }

  if (limit && Number.isInteger(limit) && limit > 0) {
    sql += ` LIMIT ${limit}`;
  }

  try {
    const rows = await db.all(sql, values);
    return rows;
  } catch (err) {
    throw parseSqliteError(err);
  }
};

/**
 * Inserts a row into a specified table.
 *
 * @param {string} tableName - Name of the table to insert into.
 * @param {object} data - Object with key-value pairs representing the row.
 * @param {object} db - SQLite database connection.
 * @returns {Promise<number>} - Resolves with the ID of the inserted row.
 * @throws {ClientError} - On empty input or SQLite error.
 */

async function rawInsertData(tableName, data, db) {
  const keys = Object.keys(data);
  const values = Object.values(data);

  if (keys.length === 0) {
    throw new ClientError('No fields were passed to insert.');
  }

  const placeholders = keys.map(() => '?').join(', ');
  const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

  try {
    const result = await db.run(sql, values);
    return result.lastID;
  } catch (err) {
    throw parseSqliteError(err);
  }
}

/**
 * Executes a single SQL INSERT for multiple rows.
 *
 * @param {string} tableName - Table name.
 * @param {object[]} dataArray - Array of objects to insert.
 * @param {object} db - SQLite database connection.
 * @returns {Promise<number>} - Last inserted row ID of the last insert.
 * @throws {ClientError} - On invalid input or SQLite error.
 */
async function rawInsertBulk(tableName, dataArray, db) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    throw new ClientError('No data provided for bulk insert.');
  }

  const keys = Object.keys(dataArray[0]);
  if (keys.length === 0) {
    throw new ClientError('Each data object must have at least one field.');
  }

  const rowPlaceholders = `(${keys.map(() => '?').join(', ')})`;
  const allPlaceholders = dataArray.map(() => rowPlaceholders).join(', ');
  const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES ${allPlaceholders}`;

  const values = dataArray.flatMap(row => keys.map(k => row[k]));

  try {
    const result = await db.run(sql, values);
    return result.lastID;
  } catch (err) {
    throw parseSqliteError(err);
  }
}


/**
 * Updates a row in the specified table by ID.
 *
 * @param {string} tableName - Table to update.
 * @param {number} id - ID of the row to update.
 * @param {object} newRow - Key-value pairs representing the changes.
 * @param {object} db - SQLite database connection.
 * @returns {Promise<number>} - Resolves with the number of rows changed (0 if not found).
 * @throws {ClientError} - On invalid input or SQLite error.
 */
async function rawUpdateData(tableName, id, newRow, db) {
  validateString(tableName, 'Invalid table name.')

  const keys = Object.keys(newRow);
  if (keys.length === 0) {
    throw new ClientError('No data to update');
  }

  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const values = keys.map(key => newRow[key]);
  values.push(id); // for WHERE id = ?

  const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;

  try {
    const result = await db.run(sql, values);
    return result.changes;
  } catch (err) {
    throw parseSqliteError(err);
  }
}

/**
 * Toggles a boolean column (0 <-> 1) on a row by ID.
 *
 * @param {string} tableName - Table name.
 * @param {number} id - ID of the row to toggle.
 * @param {string} columnName - Boolean column to toggle.
 * @param {object} db - SQLite database connection.
 * @returns {Promise<number>} - Number of affected rows (0 if not found).
 * @throws {ClientError} - On invalid input or SQLite error.
 */
async function rawToggleColumn(tableName, id, columnName, db) {
  validateString(tableName, 'Invalid table name.')

  validateString(columnName, 'Invalid column name.')

  const toggleSql = `
    UPDATE ${tableName}
    SET ${sanitizeIdentifier(columnName)} = CASE ${sanitizeIdentifier(columnName)} WHEN 1 THEN 0 ELSE 1 END
    WHERE id = ?
  `;

  try {
    const result = await db.run(toggleSql, [id]);
    return result.changes;
  } catch (err) {
    throw parseSqliteError(err);
  }
}

/**
 * Deletes a row from a table by its ID.
 *
 * @param {string} tableName - Table name.
 * @param {number} id - ID of the row to delete.
 * @param {object} db - SQLite database connection.
 * @returns {Promise<number>} - Number of affected rows (0 if not found).
 * @throws {ClientError} - On invalid input or SQLite error.
 */
async function rawDeleteById(tableName, id, db) {
  validateString(tableName, 'Invalid table name.')

  const deleteSql = `DELETE FROM ${tableName} WHERE id = ?`;

  try {
    const result = await db.run(deleteSql, [id]);
    return result.changes;
  } catch (err) {
    throw parseSqliteError(err);
  }
}

/**
 * Executes a raw SQL query with parameters.
 *
 * @param {string} sql - The SQL query string.
 * @param {Array} params - Parameters to bind to the query.
 * @param {object} db - SQLite database connection.
 * @returns {Promise<object[]>} - Resolves with resulting rows.
 * @throws {ClientError} - On query failure.
 */
async function rawQuery(sql, params, db) {
  try {
    return await db.all(sql, params);
  } catch (err) {
    throw parseSqliteError(err);
  }
}

/**
 * Parses SQLite error messages into custom ClientError instances with user-friendly messages.
 *
 * Handles known SQLite error types like:
 *  - UNIQUE constraint failed
 *  - NOT NULL constraint
 *  - CHECK constraint
 *  - Foreign key violations
 *  - Datatype mismatches
 *  - Missing table/column
 *
 * @param {Error} err - The raw SQLite error.
 * @returns {ClientError} - Custom error instance with a clearer message.
 */
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

    // FOREIGN KEY constraint failed
    if (msg.includes('FOREIGN KEY constraint failed')) {
      return new ClientError('Foreign key constraint failed: one of the referenced values does not exist in the related table.', msg);
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
 * Sanitizes a SQL identifier (e.g., table or column name) by:
 *  - Removing any single quotes ('), double quotes ("), or backticks (`),
 *  - Wrapping the resulting string in double quotes to safely use in an SQLite query.
 * 
 * Prevents syntax errors or SQL injection via identifier names.
 * 
 * @param {string} name - Raw identifier string to sanitize.
 * @returns {string} - Sanitized identifier wrapped in double quotes, or * if passed directly.
 */
function sanitizeIdentifier(name) {
    if(name === "*") return "*"
    const cleaned = name.replace(/['"`]/g, '');
    return `"${cleaned}"`;
}

/**
 * Validates that a value is a non-empty string.
 *
 * @param {any} value - The value to validate.
 * @param {string} errorMessage - The error message to throw if validation fails.
 * @returns {true} - Returns true if the value is a valid non-empty string.
 * @throws {ClientError} - If the value is not a string or is an empty/whitespace-only string.
 */
function validateString(value, errorMessage) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ClientError(errorMessage);
  }

  return true
}

module.exports = {
  rawGetData,
  rawInsertData,
  rawUpdateData,
  rawToggleColumn,
  rawDeleteById,
  rawQuery,
  rawInsertBulk
};