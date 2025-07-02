const openDb = require('./db');
const { ClientError, ServerError } = require('./errors');
const {parseSqliteError} = require("./db/rawDbFunctions")

/**
 * Wraps a database logic function in a simulated transaction using SQLite.
 * 
 * This decorator:
 * - Opens a new SQLite connection.
 * - Begins a transaction.
 * - Executes the provided function with the database as the first parameter.
 * - Always performs a ROLLBACK (simulation — no changes are committed).
 * - Converts known errors to `ClientError` or wraps others in `ServerError`.
 * 
 * @param {Function} fn - An async function of the form `(db, ...args) => any`.
 *                        Must accept a `db` connection as its first argument.
 * 
 * @returns {Function} - A wrapped async function that returns a Promise and handles transactions/errors.
 * 
 * @example
 * const getData = withSimulatedTransaction(async (db, tableName) => {
 *   return await rawGetData(tableName, ['*'], [], null, db);
 * });
 */
function withSimulatedTransaction(fn) {
  return async (...args) => {
    let db;

    try {
      db = await openDb();
      await db.run('BEGIN TRANSACTION');

      const result = await fn(db, ...args);

      try {
        await db.run('ROLLBACK');
      } catch (rollbackErr) {
        throw parseSqliteError(rollbackErr);
      }

      return result;
    } catch (err) {
      // Intentamos rollback aunque haya fallado fn()
      if (db) {
        try {
          await db.run('ROLLBACK');
        } catch (rollbackErr) {
          throw parseSqliteError(rollbackErr);
        }
      }

      // Si es un error de cliente, lo relanzamos tal cual
      if (err instanceof ClientError) {
        throw err;
      }

      // Si es otro error (SQLite u otro), lo transformamos en ServerError
      throw new ServerError('Internal server error', err.message);
    }
  };
}

module.exports = { withSimulatedTransaction };
