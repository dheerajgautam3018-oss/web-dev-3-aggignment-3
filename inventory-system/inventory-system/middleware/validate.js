const mongoose = require('mongoose');

// makes sure :id in the url is a real ObjectId before we hit the db
function validateId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: `'${req.params.id}' is not a valid product id` });
  }
  next();
}

// body must be a non-empty json object
function requireBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body cannot be empty' });
  }
  next();
}

// for the stock endpoint: { "change": 10 } or { "change": -3 }
function validateStockChange(req, res, next) {
  const { change } = req.body || {};

  if (typeof change !== 'number' || !Number.isInteger(change)) {
    return res.status(400).json({ error: "'change' must be a whole number (positive to restock, negative for a sale)" });
  }
  if (change === 0) {
    return res.status(400).json({ error: "'change' cannot be 0" });
  }
  next();
}

module.exports = { validateId, requireBody, validateStockChange };
