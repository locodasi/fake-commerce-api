const dbFunctions = require('../db/dbFunctions');
const { ClientError } = require('../errors');

const TABLE_NAME = "users" 

/**
 * Gets users from the DB, optionally filtering columns and limit.
 * @param {Array<string>} [columns=['*']] - Columns to fetch.
 * @param {number} [limit] - Maximum number of rows.
 * @returns {Promise<Array<Object>>} - Resolves with user rows.
 */
async function getUsers(columns = ['*'], limit) {
  try {
    const users = await dbFunctions.getData(TABLE_NAME, columns, limit);
    return users;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

/**
 * Gets a user from the DB, optionally filtering columns.
 * @param {number} - Id.
 * @param {Array<string>} [columns=['*']] - Columns to fetch.
 * @returns {Promise<Array<Object>>} - Resolves with user rows.
 */
async function getUserById(id, columns = ['*']) {
  try {
    const users = await dbFunctions.getDataById(TABLE_NAME, id, columns);
    return users;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

/**
 * Insert a user in the DB.
 * @param {Object} - User.
 * @returns {Promise<Array<Object>>} - Resolves with user rows.
 */
async function createUser(userData) {
  try {
    const user = await dbFunctions.insertToTable(TABLE_NAME, userData);
    return user;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

/**
 * Update a user in the DB.
 * @param {number} - Id.
 * @param {Object} - new User.
 * @returns {Promise<Array<Object>>} - Resolves with user rows.
 */
async function updateUser(id, userData) {
  try {
    const user = await dbFunctions.updateData(TABLE_NAME, id, userData);
    return user;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

/**
 * Toggle active.
 * @param {number} - Id.
 * @returns {Promise<Array<Object>>} - Resolves with user rows.
 */
async function toogleActive(id,) {
  try {
    const user = await dbFunctions.toggleBooleanField(TABLE_NAME, id, "active");
    return user;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

/**
 * Toggle admin.
 * @param {number} - Id.
 * @returns {Promise<Array<Object>>} - Resolves with user rows.
 */
async function toogleAdmin(id,) {
  try {
    const user = await dbFunctions.toggleBooleanField(TABLE_NAME, id, "admin");
    return user;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

/**
 * Delete user.
 * @param {number} - Id.
 * @returns {Promise<Array<Object>>} - Resolves with user rows.
 */
async function deleteUser(id) {
  try {
    const deleteId = await dbFunctions.deleteRowById(TABLE_NAME, id);
    return deleteId;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}

/**
 * Change password.
 * @param {number} id - User id
 * @param {string} actualPassword - The actual password.
 * @param {string} newPassword - The new password.
 * @returns {Promise<Array<Object>>} - Resolves with user rows.
 */
async function changePassword(id, actualPassword, newPassword) {
  try {
    const user = await dbFunctions.getDataById(TABLE_NAME, id, ["password"])

    if(user.password !== actualPassword) throw new ClientError("Incorrect password")

    const newUser = await dbFunctions.updateData(TABLE_NAME, id, {password: newPassword});
    return newUser;
  } catch (error) {
    throw error; // Propagamos el error para manejarlo en el endpoint
  }
}



module.exports = { getUsers, getUserById, createUser, updateUser, toogleActive, toogleAdmin, deleteUser, changePassword };