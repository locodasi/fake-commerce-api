const express = require('express');
const errorHandler = require('./middlewares/errorHandler');

const statusRoutes = require('./routes/status');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories')
const productRoutes = require('./routes/products')
const purchasesRoutes = require('./routes/purchases')

const app = express();

app.use(express.json());

// Rutas
app.use('/api', statusRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchasesRoutes);

app.use(errorHandler);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
