const Product = require('../models/Product');

const SORTABLE = ['name', 'price', 'quantity', 'category', 'createdAt', 'updatedAt'];

// escape user input before putting it inside a regex
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

// GET /api/products?category=&supplier=&search=&minPrice=&maxPrice=&inStock=&sort=&page=&limit=
exports.getProducts = async (req, res, next) => {
  try {
    const { category, supplier, search, minPrice, maxPrice, inStock, sort } = req.query;

    const filter = {};
    if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
    if (supplier) filter.supplier = new RegExp(escapeRegex(supplier), 'i');
    if (search) filter.name = new RegExp(escapeRegex(search), 'i');

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (inStock === 'true') filter.quantity = { $gt: 0 };
    if (inStock === 'false') filter.quantity = 0;

    // sort=-price,name  ->  { price: -1, name: 1 }
    let sortBy = { createdAt: -1 };
    if (sort) {
      sortBy = {};
      for (const part of sort.split(',')) {
        const field = part.replace(/^-/, '');
        if (!SORTABLE.includes(field)) {
          return res.status(400).json({ error: `Cannot sort by '${field}'. Allowed: ${SORTABLE.join(', ')}` });
        }
        sortBy[field] = part.startsWith('-') ? -1 : 1;
      }
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: products.length,
      products,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/products/:id/stock   body: { "change": 10 }
exports.adjustStock = async (req, res, next) => {
  try {
    const { change } = req.body;

    // the quantity >= -change check lives inside the query so two sales
    // at the same time can't push stock below zero
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, quantity: { $gte: -change } },
      { $inc: { quantity: change } },
      { new: true }
    );

    if (!product) {
      const existing = await Product.findById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Product not found' });
      return res.status(400).json({
        error: `Not enough stock. Available: ${existing.quantity}, requested: ${Math.abs(change)}`,
      });
    }

    res.json({ message: 'Stock updated', product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted', id: product.id });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/low-stock
exports.getLowStock = async (req, res, next) => {
  try {
    const lowStockItems = await Product.aggregate([
      { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
      { $sort: { quantity: 1 } },
    ]);

    // aggregate skips mongoose getters, so add the fields the other endpoints return
    const items = lowStockItems.map((p) => ({
      ...p,
      stockValue: p.price * p.quantity,
      id: p._id,
    }));

    res.json({ count: items.length, lowStockItems: items });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/summary
exports.getCategorySummary = async (req, res, next) => {
  try {
    const summary = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          avgPrice: { $avg: '$price' },
        },
      },
      { $addFields: { avgPrice: { $round: ['$avgPrice', 2] } } },
      { $sort: { totalStockValue: -1 } },
    ]);

    res.json({ categories: summary.length, summary });
  } catch (err) {
    next(err);
  }
};
