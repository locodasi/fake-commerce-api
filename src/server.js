const express = require('express');
const statusRoutes = require('./routes/status');
const userRoutes = require('./routes/users');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

// Rutas
app.use('/api', statusRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
