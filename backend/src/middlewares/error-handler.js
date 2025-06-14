// backend/src/middleware/error-handler.js
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}

const errorHandler = (err, req, res, next) => {
    const { statusCode = 500, message } = err;

    logger.error({
        error: err,
        request: req.url,
        method: req.method,
        ip: req.ip
    });

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};