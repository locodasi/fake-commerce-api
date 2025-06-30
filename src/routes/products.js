const express = require('express');
const { productSchema, updateProductSchema } = require('../validations/productSchema');
const productsController = require('../controllers/productControllers');

const router = express.Router();


/**
 * GET /products
 * Query params:
 *  - limit (optional): number
 *  - columns (optional): comma separated list of columns
 */
router.get('/', async (req, res, next) => {
    try {
      // Parse limit
      let limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      if (limit !== undefined && (isNaN(limit) || limit <= 0)) {
        return res.status(400).json({ error: 'Invalid limit parameter' });
      }
  
      // Parse columns
      let columns = ['*'];
      if (req.query.columns) {
        columns = req.query.columns.split(',').map(c => c.trim()).filter(c => c.length > 0);
        if (columns.length === 0) columns = ['*'];
      }

      const filters = [];

      if (req.query.category_id) {
        filters.push({ column: 'category_id', operator: '=', value: parseInt(req.query.category_id) });
      }
    
      if (req.query.min_price) {
        filters.push({ column: 'price', operator: '>=', value: parseFloat(req.query.min_price) });
      }
    
      if (req.query.max_price) {
        filters.push({ column: 'price', operator: '<=', value: parseFloat(req.query.max_price) });
      }
  
      // Llamamos al controller
      const products = await productsController.getProducts(columns, filters, limit);
  
      if (!products || products.length === 0) {
        return res.status(404).json({ error: 'No product found' });
      }
  
      res.json({ data: products });
    } catch (error) {
      next(error)
    }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Parse columns
    let columns = ['*'];
    if (req.query.columns) {
      columns = req.query.columns.split(',').map(c => c.trim()).filter(c => c.length > 0);
      if (columns.length === 0) columns = ['*'];
    }

    // Llamamos al controller
    const products = await productsController.getProductById(id, columns);

    if (!products || products.length === 0) {
      return res.status(404).json({ error: 'No product found' });
    }

    res.json({ data: products });
  } catch (error) {
    next(error)
  }
});

// POST - Simulado
router.post('/', async (req, res) => {
  const result = productSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.format() });
  }

  const product = await productsController.createProduct(result.data);

  res.json({ data: product });
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const result = updateProductSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.format() });
  }

  const product = await productsController.updateProduct(id, result.data);

  res.json({ data: product });
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const deleteId = await productsController.deleteProduct(id);

  res.json({ data: deleteId });
});

module.exports = router;