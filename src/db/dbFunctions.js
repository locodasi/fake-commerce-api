const { withSimulatedTransaction } = require('../decoratores');
const { rawGetData, rawInsertData, rawUpdateData, rawToggleColumn, rawDeleteById, rawQuery, rawInsertBulk } = require('./rawDbFunctions');
const {ClientError} = require("../errors")

/**
 * Inserts a record into the indicated table, simulated (with ROLLBACK).
 * @param {string} tableName - Table name.
 * @param {object} data - Object with the fields to be inserted.
 * @returns {Promise<object>} - Resolves with the inserted row (not committed).
 */
const insertToTable = withSimulatedTransaction(async (db, tableName, data) => {
  const insertedId = await rawInsertData(tableName, data, db);

  const result = await rawGetData(
    tableName,
    ['*'],                     // columns
    [{ column: 'id', operator: '=', value: insertedId }],
    1,                         // limit
    db
  );

  return result[0] || null; // devolvemos el registro insertado
});

/**
 * Fetches data from a given table with optional column selection and row limit.
 * @param {string} tableName - Name of the table to query.
 * @param {string[]} [columns=['*']] - List of column names to retrieve.
 * @param {Object[]} [filters=[]] - Array of filters: { column, operator, value }.
 * @param {number} [limit] - Optional maximum number of rows to return.
 * @returns {Promise<object[]>} - Resolves with an array of rows from the database.
 */
const getData = withSimulatedTransaction(async (db, tableName, columns = ['*'], filters = [], limit) => {
  const result = await rawGetData(tableName, columns, filters, limit, db);
  return result;
});



/**
 * Fetches one row from a given table by ID with optional column selection.
 * @param {string} tableName - Name of the table to query.
 * @param {number} id - ID of the row to fetch.
 * @param {string[]} [columns=['*']] - List of column names to retrieve.
 * @returns {Promise<object|null>} - Resolves with a single row or null.
 */
const getDataById = withSimulatedTransaction(async (db, tableName, id, columns = ['*']) => {
  const rows = await rawGetData(
    tableName,
    columns,
    [{ column: 'id', operator: '=', value: id }],
    1,
    db
  );

  return rows[0] || null;
});

/**
 * Updates a row in a table by ID.
 * @param {string} tableName - Name of the table.
 * @param {number} id - ID of the row to update.
 * @param {Object} newRow - The changes to apply.
 * @returns {Promise<object>} - Resolves with the updated row.
 * @throws {ClientError} - If no changes were made or the row does not exist.
 */
const updateData = withSimulatedTransaction(async (db, tableName, id, newRow) => {
  const changes = await rawUpdateData(tableName, id, newRow, db);

  if (changes === 0) {
    throw new ClientError('Element not found or nothing changed');
  }

  const updatedRows = await rawGetData(
    tableName,
    ['*'],
    [{ column: 'id', operator: '=', value: id }],
    1,
    db
  );

  return updatedRows[0] || null;
});


/**
 * Simulates toggling a boolean field (0/1) in a row.
 * @param {string} tableName - Name of the table.
 * @param {number} id - ID of the row to toggle.
 * @param {string} columnName - Boolean column to toggle.
 * @returns {Promise<object>} - Resolves with the toggled row (not committed).
 * @throws {ClientError} - If no row was affected.
 */
const toggleBooleanField = withSimulatedTransaction(async (db, tableName, id, columnName) => {
  const changes = await rawToggleColumn(tableName, id, columnName, db);

  if (changes === 0) {
    throw new ClientError('Record not found or no change applied');
  }

  const [row] = await rawGetData(
    tableName,
    ['*'],
    [{ column: 'id', operator: '=', value: id }],
    1,
    db
  );

  return row || null;
});




/**
 * Simulates deleting a row by ID from a table.
 * @param {string} tableName - Name of the table.
 * @param {number} id - ID of the row to delete.
 * @returns {Promise<object>} - Resolves with an object confirming the deletion (not committed).
 * @throws {ClientError} - If no row was affected.
 */
const deleteRowById = withSimulatedTransaction(async (db, tableName, id) => {
  const changes = await rawDeleteById(tableName, id, db);

  if (changes === 0) {
    throw new ClientError('Record not found or no change applied');
  }

  return { id }; // Devolvemos el ID como confirmación
});

/**
 * Retrieves a purchase by its ID, including its items,
 * each with related product and category information.
 *
 * @param {object} db - The SQLite database connection.
 * @param {number} purchaseId - The ID of the purchase to retrieve.
 * @param {string[]} columns - Array of column names to retrieve from the `purchases` table.
 * @returns {Promise<object>} - A promise that resolves to the purchase object,
 */
const getPurchase = withSimulatedTransaction(async (db, purchaseId, columns) => {
  const purchase = (await rawGetData("purchases",columns, [{column: "id", operator: "=", value: purchaseId}], 1, db))[0]
  if(purchase === undefined){
    return null
  }
  const purchaseItems = await getPurchaseItemsWithProductAndCategory(db, purchaseId);

  purchase["purchase_items"] = purchaseItems
  return purchase
});

const createPurchase = withSimulatedTransaction(async (db, purchaseData) => {
  const products = await rawGetData("products",["*"],[{column: "id", operator: "IN", value: purchaseData.products.map(p => p.product_id)}], null, db)

  let total = 0;

  const purchaseItemsToInsert = []

  for(let item of purchaseData.products){
    const product_data = products.find(p => p.id === item.product_id)
    item["price_at_time"] = product_data.price
    total += product_data.price * item.quantity
    purchaseItemsToInsert.push(item)
  }

  const roundedTotal = parseFloat(total.toFixed(2));

  const purchaseId = await rawInsertData("purchases", {buyer_id: purchaseData.buyer_id, total: roundedTotal}, db);
  purchaseItemsToInsert.forEach(p => p["purchase_id"] = purchaseId)
  await rawInsertBulk("purchase_items",purchaseItemsToInsert, db)
  
  const purchase = (await rawGetData("purchases",["*"], [{column: "id", operator: "=", value: purchaseId}], 1, db))[0]
  const purchaseItems = await getPurchaseItemsWithProductAndCategory(db, purchaseId);

  purchase["purchase_items"] = purchaseItems
  return purchase
});

const getPurchaseItemsWithProductAndCategory = async (db, purchaseId) => {
  const sql = `
    SELECT
      pi.id AS item_id,
      pi.quantity,
      pi.price_at_time,
      p.id AS product_id,
      p.name AS product_name,
      p.price AS product_price,
      c.id AS category_id,
      c.name AS category_name
    FROM purchase_items pi
    JOIN products p ON p.id = pi.product_id
    JOIN categories c ON c.id = p.category_id
    WHERE pi.purchase_id = ?
  `;

  const rows = await rawQuery(sql, [purchaseId], db);

  return rows.map(row => ({
    id: row.item_id,
    quantity: row.quantity,
    price_at_time: row.price_at_time,
    item: {
      id: row.product_id,
      name: row.product_name,
      price: row.product_price,
      category: {
        id: row.category_id,
        name: row.category_name
      }
    }
  }));
};

  
module.exports = {
  insertToTable,
  getData,
  getDataById,
  updateData,
  toggleBooleanField,
  deleteRowById,
  getPurchase,
  createPurchase
};
