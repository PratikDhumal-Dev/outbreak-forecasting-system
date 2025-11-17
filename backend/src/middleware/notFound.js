function notFoundHandler(req, res, next) {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  next(error);
}

module.exports = notFoundHandler;

