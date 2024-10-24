class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = false;
        this.isAppError = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;

module.exports.sendAppError = (extras, message, statusCode) => {
    if (extras.transaction) {
        return extras.transaction?.rollback().finally(() => extras.next(new AppError(message, statusCode)));
    }
    else {
        return extras.next(new AppError(message, statusCode));
    }
}