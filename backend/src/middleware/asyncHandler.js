/**
 * Async handler wrapper for Express 5 route handlers.
 * Catches rejected promises and forwards errors to Express error handler.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
