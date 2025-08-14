/**
 * Request Timing Middleware
 * Adds request start time for performance monitoring
 */

module.exports = (req, res, next) => {
    req.startTime = Date.now();
    next();
};
