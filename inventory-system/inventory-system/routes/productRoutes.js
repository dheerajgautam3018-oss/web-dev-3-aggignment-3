const express = require('express');
const c = require('../controllers/productController');
const { validateId, requireBody, validateStockChange } = require('../middleware/validate');

const router = express.Router();

// fixed paths have to come before '/:id' or express treats "low-stock" as an id
router.get('/low-stock', c.getLowStock);
router.get('/summary', c.getCategorySummary);

router.route('/')
  .get(c.getProducts)
  .post(requireBody, c.createProduct);

router.patch('/:id/stock', validateId, validateStockChange, c.adjustStock);

router.route('/:id')
  .get(validateId, c.getProductById)
  .put(validateId, requireBody, c.updateProduct)
  .delete(validateId, c.deleteProduct);

module.exports = router;
