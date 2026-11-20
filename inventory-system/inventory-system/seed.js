// npm run seed  -> wipes the products collection and adds 12 sample items
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-204', category: 'Furniture', price: 5499, quantity: 15, reorderLevel: 5, supplier: 'Godrej Interio' },
  { name: 'Laptop 15 inch', sku: 'ELEC-LP-101', category: 'Electronics', price: 54999, quantity: 6, reorderLevel: 5, supplier: 'Lenovo' },
  { name: 'Wireless Mouse', sku: 'ELEC-MS-330', category: 'Electronics', price: 799, quantity: 45, reorderLevel: 15, supplier: 'Logitech' },
  { name: 'Bluetooth Speaker', sku: 'ELEC-SP-412', category: 'Electronics', price: 2499, quantity: 3, reorderLevel: 8, supplier: 'boAt' },
  { name: 'USB-C Cable', sku: 'ELEC-CB-077', category: 'Electronics', price: 299, quantity: 42, reorderLevel: 20, supplier: 'Anker' },
  { name: 'Cotton T-Shirt', sku: 'APRL-TS-518', category: 'Apparel', price: 499, quantity: 60, reorderLevel: 20, supplier: 'Allen Solly' },
  { name: 'Denim Jacket', sku: 'APRL-JK-620', category: 'Apparel', price: 2299, quantity: 18, reorderLevel: 6, supplier: 'Levis' },
  { name: 'Spiral Notebook A4', sku: 'STNY-NB-155', category: 'Stationery', price: 90, quantity: 8, reorderLevel: 25, supplier: 'Classmate' },
  { name: 'Ball Pen Box', sku: 'STNY-PN-201', category: 'Stationery', price: 150, quantity: 70, reorderLevel: 30, supplier: 'Reynolds' },
  { name: 'Basmati Rice 5kg', sku: 'GROC-RC-909', category: 'Grocery', price: 620, quantity: 25, reorderLevel: 10, supplier: 'India Gate' },
  { name: 'Olive Oil 1L', sku: 'GROC-OL-318', category: 'Grocery', price: 899, quantity: 4, reorderLevel: 10, supplier: 'Figaro' },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
