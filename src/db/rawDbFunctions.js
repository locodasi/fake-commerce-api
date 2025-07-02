const { ClientError, ServerError } = require('../errors');

const rawGetData = async (tableName, columns = ['*'], filters = [], limit, db, done) => {
  if (typeof tableName !== 'string' || !tableName.trim()) {
    return done(new ClientError('Invalid table name.'));
  }

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
      return done(new ClientError(`Invalid operator '${operator}' in filter.`));
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

async function rawUpdateData(tableName, id, newRow, db) {
  if (typeof tableName !== 'string' || !tableName.trim()) {
    throw new ClientError('Invalid table name.');
  }

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

async function rawToggleColumn(tableName, id, columnName, db) {
  if (typeof tableName !== 'string' || !tableName.trim()) {
    throw new ClientError('Invalid table name.');
  }

  if (typeof columnName !== 'string' || !columnName.trim()) {
    throw new ClientError('Invalid column name.');
  }

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

async function rawDeleteById(tableName, id, db) {
  if (typeof tableName !== 'string' || !tableName.trim()) {
    throw new ClientError('Invalid table name.');
  }

  const deleteSql = `DELETE FROM ${tableName} WHERE id = ?`;

  try {
    const result = await db.run(deleteSql, [id]);
    return result.changes;
  } catch (err) {
    throw parseSqliteError(err);
  }
}

async function rawQuery(sql, params, db) {
  try {
    return await db.all(sql, params);
  } catch (err) {
    throw parseSqliteError(err);
  }
}

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
  rawGetData,
  rawInsertData,
  rawUpdateData,
  rawToggleColumn,
  rawDeleteById,
  rawQuery
};