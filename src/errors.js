class AppError extends Error {
    constructor(message, statusCode = 500, raw = null) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        this.raw = raw;
    }
}
  
class ClientError extends AppError {
    constructor(message, raw = null) {
        super(message, 400, raw);
    }
}

class ServerError extends AppError {
    constructor(message = 'Internal server error', raw = null) {
      super(message, 500, raw);
    }
}
  
class NotFoundError extends AppError {
    constructor(message, raw = null) {
        super(message, 404, raw);
    }
}

module.exports = {
    AppError,
    ClientError,
    NotFoundError,
    ServerError
};
  