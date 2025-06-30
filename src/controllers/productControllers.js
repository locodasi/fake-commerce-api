const dbFunctions = require('../db/dbFunctions');
const { ClientError } = require('../errors');

const TABLE_NAME = "products" 

/**
 * Gets products from the DB, optionally filtering columns and limit.
 * @param {Array<string>} [columns=['*']] - Columns to fetch.
 * @param {Object[]} [filters=[]] - Array of filters: { column, operator, value }.
 * @param {number} [limit] - Maximum number of rows.
 * @returns {Promise<Array<Object>>} - Resolves with products rows.
 */
async function getProducts(columns = ['*'], filters = [], limit) {
  try {
    const products = await dbFunctions.getData(TABLE_NAME, columns, filters, limit);
    return products;
  } catch (error) {
    throw error; 
  }
}

/**
 * Gets a product from the DB, optionally filtering columns.
 * @param {number} - Id.
 * @param {Array<string>} [columns=['*']] - Columns to fetch.
 * @returns {Promise<Array<Object>>} - Resolves with products rows.
 */
async function getProductById(id, columns = ['*']) {
  try {
    const products = await dbFunctions.getDataById(TABLE_NAME, id, columns);
    return products;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

/**
 * Insert a product in the DB.
 * @param {Object} - product.
 * @returns {Promise<Array<Object>>} - Resolves with products rows.
 */
async function createProduct(productData) {
  try {
    const products = await dbFunctions.insertToTable(TABLE_NAME, productData);
    return products;
  } catch (error) {
    throw error;
  }
}

/**
 * Update a product in the DB.
 * @param {number} - Id.
 * @param {Object} - new product.
 * @returns {Promise<Array<Object>>} - Resolves with products rows.
 */
async function updateProduct(id, productData) {
  try {
    const user = await dbFunctions.updateData(TABLE_NAME, id, productData);
    return user;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete product.
 * @param {number} - Id.
 * @returns {Promise<Array<Object>>}
 */
async function deleteProduct(id) {
  try {
    const deleteId = await dbFunctions.deleteRowById(TABLE_NAME, id);
    return deleteId;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

module.exports = { createProduct, getProducts, getProductById, deleteProduct, updateProduct };