const express = require('express');
const { purchaseSchema } = require('../validations/purchaseSchema');
const purchasesController = require('../controllers/purchaseControllers');

const router = express.Router();


/**
 * GET /purchases
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

      if (req.query.min_date) {
        filters.push({ column: 'created_at', operator: '>=', value: req.query.min_date });
      }
    
      if (req.query.max_date) {
        filters.push({ column: 'created_at', operator: '<=', value: req.query.max_date });
      }

      console.log(filters)
  
      // Llamamos al controller
      const purchases = await purchasesController.getPurchases(columns, filters, limit);
  
      if (!purchases || purchases.length === 0) {
        return res.status(404).json({ error: 'No purchase found' });
      }
  
      res.json({ data: purchases });
    } catch (error) {
      next(error)
    }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid purchase ID' });
    }

    // Parse columns
    let columns = ['*'];
    if (req.query.columns) {
      columns = req.query.columns.split(',').map(c => c.trim()).filter(c => c.length > 0);
      if (columns.length === 0) columns = ['*'];
    }

    // Llamamos al controller
    const purchases = await purchasesController.getPurchaseById(id, columns);

    if (!purchases || purchases.length === 0) {
      return res.status(404).json({ error: 'No purchase found' });
    }

    res.json({ data: purchases });
  } catch (error) {
    next(error)
  }
});

// POST - Simulado
router.post('/', async (req, res) => {
  const result = purchaseSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.format() });
  }

  const purchase = await purchasesController.createPurchase(result.data);

  res.json({ data: purchase });
});

module.exports = router;