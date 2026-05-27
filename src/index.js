const express = require('express');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Load OpenAPI spec
const openApiPath = path.join(__dirname, '..', 'openapi.yaml');
let swaggerDocument;
try {
  swaggerDocument = yaml.load(fs.readFileSync(openApiPath, 'utf8'));
} catch (e) {
  console.error('Could not load openapi.yaml:', e.message);
  swaggerDocument = {};
}

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// In-memory products store
let products = [
  { id: 1, name: 'Widget Alpha', price: 9.99, stock: 100 },
  { id: 2, name: 'Gadget Beta', price: 24.99, stock: 50 },
  { id: 3, name: 'Doohickey Gamma', price: 4.99, stock: 200 },
];
let nextId = 4;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'dummy-api',
    version: '1.0.0',
  });
});

// GET /products
app.get('/products', (req, res) => {
  res.json({ data: products, total: products.length });
});

// GET /products/:id
app.get('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found', id });
  }
  res.json({ data: product });
});

// POST /products
app.post('/products', (req, res) => {
  const { name, price, stock } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'name and price are required' });
  }
  const product = { id: nextId++, name, price: Number(price), stock: Number(stock) || 0 };
  products.push(product);
  res.status(201).json({ data: product });
});

// PUT /products/:id
app.put('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found', id });
  }
  const { name, price, stock } = req.body;
  products[index] = { ...products[index], ...(name && { name }), ...(price !== undefined && { price: Number(price) }), ...(stock !== undefined && { stock: Number(stock) }) };
  res.json({ data: products[index] });
});

// DELETE /products/:id
app.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found', id });
  }
  products.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dummy API running on http://0.0.0.0:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
