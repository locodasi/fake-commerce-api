const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

module.exports = router;
