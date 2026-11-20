function notFound(req, res, next) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

// every error in the app ends up here
function errorHandler(err, req, res, next) {
  // mongoose validation failed
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details });
  }

  // bad id / bad type in a query
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for '${err.path}'` });
  }

  // duplicate sku
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `A product with this ${field} already exists` });
  }

  // malformed json in the request body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
