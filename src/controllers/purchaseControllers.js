const dbFunctions = require('../db/dbFunctions');
const { ClientError } = require('../errors');

const TABLE_NAME = "purchases" 

/**
 * Gets purchases from the DB, optionally filtering columns and limit.
 * @param {Array<string>} [columns=['*']] - Columns to fetch.
 * @param {Object[]} [filters=[]] - Array of filters: { column, operator, value }.
 * @param {number} [limit] - Maximum number of rows.
 * @returns {Promise<Array<Object>>} - Resolves with purchases rows.
 */
async function getPurchases(columns = ['*'], filters = [], limit) {
  try {
    const purchases = await dbFunctions.getData(TABLE_NAME, columns, filters, limit);
    return purchases;
  } catch (error) {
    throw error; 
  }
}

/**
 * Gets a purchase from the DB, optionally filtering columns.
 * @param {number} - Id.
 * @param {Array<string>} [columns=['*']] - Columns to fetch.
 * @returns {Promise<Array<Object>>} - Resolves with purchases rows.
 */
async function getPurchaseById(id, columns = ['*']) {
  try {
    const purchases = await dbFunctions.getDataById(TABLE_NAME, id, columns);
    return purchases;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

/**
 * Insert a purchase in the DB.
 * @param {Object} - Purchase.
 * @returns {Promise<Array<Object>>} - Resolves with purchases rows.
 */
async function createPurchase(purchaseData) {
  try {
    const purchases = await dbFunctions.insertToTable(TABLE_NAME, purchaseData);
    return purchases;
  } catch (error) {
    throw error;
  }
}

module.exports = { createPurchase, getPurchases, getPurchaseById };