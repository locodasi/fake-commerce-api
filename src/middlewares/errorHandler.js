const { ServerError } = require('../errors');

function errorHandler(err, req, res, next) {
    if (err.constructor.name === 'TypeError') {
      err = new ServerError('Internal server error', err.message);
    }
    
    const status = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    const raw = err.raw || err.stack || '';
  
    console.error(`[ERROR ${status}]`, message);
    if (raw && raw !== message) {
      console.error('RAW:', raw);
    }
  
    res.status(status).json({ error: message });
}  

module.exports = errorHandler;