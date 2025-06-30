const dbFunctions = require('../db/dbFunctions');
const { ClientError } = require('../errors');

const TABLE_NAME = "categories" 

/**
 * Gets categories from the DB, optionally filtering columns and limit.
 * @param {Array<string>} [columns=['*']] - Columns to fetch.
 * @param {Object[]} [filters=[]] - Array of filters: { column, operator, value }.
 * @param {number} [limit] - Maximum number of rows.
 * @returns {Promise<Array<Object>>} - Resolves with categories rows.
 */
async function getCategories(columns = ['*'], filters = [], limit) {
  try {
    const categories = await dbFunctions.getData(TABLE_NAME, columns, filters, limit);
    return categories;
  } catch (error) {
    throw error; 
  }
}

/**
 * Gets a category from the DB, optionally filtering columns.
 * @param {number} - Id.
 * @param {Array<string>} [columns=['*']] - Columns to fetch.
 * @returns {Promise<Array<Object>>} - Resolves with categories rows.
 */
async function getCategoryById(id, columns = ['*']) {
  try {
    const categories = await dbFunctions.getDataById(TABLE_NAME, id, columns);
    return categories;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

/**
 * Insert a category in the DB.
 * @param {Object} - Category.
 * @returns {Promise<Array<Object>>} - Resolves with categories rows.
 */
async function createCategory(categoryData) {
  try {
    console.log(categoryData)
    const categories = await dbFunctions.insertToTable(TABLE_NAME, categoryData);
    return categories;
  } catch (error) {
    throw error;
  }
}

/**
 * Update a category in the DB.
 * @param {number} - Id.
 * @param {Object} - new Category.
 * @returns {Promise<Array<Object>>} - Resolves with categories rows.
 */
async function updateCategory(id, categoryData) {
  try {
    const user = await dbFunctions.updateData(TABLE_NAME, id, categoryData);
    return user;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete category.
 * @param {number} - Id.
 * @returns {Promise<Array<Object>>}
 */
async function deleteCategory(id) {
  try {
    const deleteId = await dbFunctions.deleteRowById(TABLE_NAME, id);
    return deleteId;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

module.exports = { createCategory, getCategories, getCategoryById, deleteCategory, updateCategory };