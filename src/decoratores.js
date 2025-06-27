const { ServerError } = require('./errors');

/**
 * Wraps a DB logic function to:
 * - Automatically create a Promise
 * - Catch any unexpected exceptions and convert them into ServerErrors
 * - Resolve/reject based on returned { err, data } from the wrapped function
 *
 * @param {Function} fn - Function to wrap. Should return { err, data }
 * @returns {Function} - A function that returns a Promise
 */
function withDbErrorHandling(fn) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      try {
            fn(...args, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
      } catch (error) {
        return reject(new ServerError('Internal server error', error.message));
      }
    });
  };
}

module.exports = { withDbErrorHandling };
