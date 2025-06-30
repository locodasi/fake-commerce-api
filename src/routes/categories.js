const express = require('express');
const { categorySchema } = require('../validations/categorySchema');
const categoriesController = require('../controllers/categoryControllers');

const router = express.Router();


/**
 * GET /categories
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
  
      // Llamamos al controller
      const categories = await categoriesController.getCategories(columns, limit);
  
      if (!categories || categories.length === 0) {
        return res.status(404).json({ error: 'No category found' });
      }
  
      res.json({ data: categories });
    } catch (error) {
      next(error)
    }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    // Parse columns
    let columns = ['*'];
    if (req.query.columns) {
      columns = req.query.columns.split(',').map(c => c.trim()).filter(c => c.length > 0);
      if (columns.length === 0) columns = ['*'];
    }

    // Llamamos al controller
    const categories = await categoriesController.getCategoryById(id, columns);

    if (!categories || categories.length === 0) {
      return res.status(404).json({ error: 'No category found' });
    }

    res.json({ data: categories });
  } catch (error) {
    next(error)
  }
});

// POST - Simulado
router.post('/', async (req, res) => {
  const result = categorySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.format() });
  }

  const category = await categoriesController.createCategory(result.data);

  res.json({ data: category });
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  const result = categorySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.format() });
  }

  const category = await categoriesController.updateCategory(id, result.data);

  res.json({ data: category });
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  const deleteId = await categoriesController.deleteCategory(id);

  res.json({ data: deleteId });
});

module.exports = router;