const express = require('express');
const { userSchema, updateUserSchema, changeUserPasswordSchema } = require('../validations/userSchema');
const userController = require('../controllers/userControllers');
const {parseBoolean} = require("../utils")
const router = express.Router();


/**
 * GET /users
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

      if (req.query.admin) {
        filters.push({ column: 'admin', operator: '=', value: parseBoolean(req.query.admin) });
      }
    
      if (req.query.active) {
        filters.push({ column: 'active', operator: '=', value: parseBoolean(req.query.active) });
      }

      // Llamamos al controller
      const users = await userController.getUsers(columns, filters, limit);
  
      if (!users || users.length === 0) {
        return res.status(404).json({ error: 'No users found' });
      }
  
      res.json({ data: users });
    } catch (error) {
      next(error)
    }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Parse columns
    let columns = ['*'];
    if (req.query.columns) {
      columns = req.query.columns.split(',').map(c => c.trim()).filter(c => c.length > 0);
      if (columns.length === 0) columns = ['*'];
    }

    // Llamamos al controller
    const users = await userController.getUserById(id, columns);

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }

    res.json({ data: users });
  } catch (error) {
    next(error)
  }
});

// POST - Simulado
router.post('/', async (req, res) => {
  const result = userSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.format() });
  }

  const user = await userController.createUser(result.data);

  res.json({ data: user });
});

router.put('/active/:id', async (req, res) => {
  const id = req.params.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const user = await userController.toogleActive(id);

  res.json({ data: user });
});

router.put('/admin/:id', async (req, res) => {
  const id = req.params.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const user = await userController.toogleAdmin(id);

  res.json({ data: user });
});

router.put('/password/:id', async (req, res) => {
  const id = req.params.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const result = changeUserPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.format() });
  }

  const data = result.data

  const user = await userController.changePassword(id, data.actualPassword, data.newPassword);

  res.json({ data: user });
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const result = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.format() });
  }

  const user = await userController.updateUser(id, result.data);

  res.json({ data: user });
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const deleteId = await userController.deleteUser(id);

  res.json({ data: deleteId });
});

module.exports = router;
