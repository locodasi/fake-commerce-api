const openDb = require('./db');
const { ClientError, ServerError } = require('./errors');

/**
 * Wraps a DB logic function to:
 * - Automatically create a Promise
 * - Manage the transaction
 * - Catch any unexpected exceptions and convert them into ServerErrors
 * - Resolve/reject based on returned { err, data } from the wrapped function
 *
 * @param {Function} fn - Function to wrap. Should return { err, data }
 * @returns {Function} - A function that returns a Promise
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


/**
 * Wraps a logic function to:
 * - Automatically create a Promise
 * - Catch any unexpected exceptions and convert them into ServerErrors
 * - Resolve/reject based on returned { err, data } from the wrapped function
 *
 * @param {Function} fn - Function to wrap. Should return { err, data }
 * @returns {Function} - A function that returns a Promise
 */
function withPromise(fn) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      try {
        fn(...args, (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      } catch (error) {
        reject(error);
      }
    });
  };
}


module.exports = { withSimulatedTransaction, withPromise };
