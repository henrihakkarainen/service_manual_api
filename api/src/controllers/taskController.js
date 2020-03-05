const pool = require('../db/pool')

const successMsg = { status: 'success' }
const errorMsg = { status: 'error' }

pool.on('connect', () => {
  console.log('Client connected to database!')
})

/**
 * Add a new maintenance task to the database.
 * 
 * @param {Object} req is express request object
 * @param {Object} res is express response object
 */
const addTask = async (req, res) => {
  const { descr, prio, mode, deviceid } = req.body
  // Check that all the required fields have been given
  if (!descr || !prio || !mode || !deviceid) {
    errorMsg.error = 'Required fields are: descr, prio, mode, deviceid'
    return res.status(400).json(errorMsg)
  }
  const sql = `INSERT INTO task (descr, prio, mode, deviceid)
               VALUES ($1, LOWER($2), LOWER($3), $4)
               returning *;`
  const values = [descr, prio, mode, deviceid]
  try {
    const { rows } = await pool.query(sql, values)
    successMsg.data = rows[0]
    return res.status(201).json(successMsg)
  } catch (err) {
    errorMsg.error = err
    return res.status(500).json(errorMsg)
  }
}

/**
 * List all maintenance tasks from the database.
 * 
 * @param {Object} req is express request object
 * @param {Object} res is express response object
 */
const getAllTasks = async (req, res) => {
  const sql = `SELECT taskid, entry_date, descr, prio, mode, deviceid
               FROM task
               ORDER BY CASE WHEN LOWER(prio) = 'critical' THEN '1'
                             WHEN LOWER(prio) = 'important' THEN '2'
                             ELSE '3'
                        END ASC, entry_date DESC`
  try {
    const { rows } = await pool.query(sql)
    return res.status(200).json(rows)
  } catch (err) {
    errorMsg.error = err
    return res.status(500).json(errorMsg)
  }
}

/**
 * Get information about a single maintenance task by its id.
 * 
 * @param {Object} req is express request object
 * @param {Object} res is express response object
 */
const getTaskById = async (req, res) => {
  const sql = `SELECT taskid, entry_date, descr, prio, mode, deviceid
               FROM task
               WHERE taskid = $1`
  const taskid = req.params.id
  try {
    const { rows } = await pool.query(sql, [taskid])
    if (rows.length === 0) {
      errorMsg.error = `Task with given id (${taskid}) was not found`
      return res.status(404).json(errorMsg)
    }
    return res.status(200).json(rows)
  } catch (err) {
    errorMsg.error = err
    return res.status(500).json(errorMsg)
  }
}

/**
 * List all maintenance tasks that are pointed for a specific device by
 * the device id.
 * 
 * @param {Object} req is express request object
 * @param {Object} res is express response object
 */
const getTasksByDevice = async (req, res) => {
  const sql = `SELECT taskid, entry_date, descr, prio, mode, deviceid
               FROM task
               WHERE deviceid = $1
               ORDER BY CASE WHEN LOWER(prio) = 'critical' THEN '1'
                             WHEN LOWER(prio) = 'important' THEN '2'
                             ELSE '3'
                        END ASC, entry_date DESC`
  const deviceid = req.params.id
  try {
    // Check that a device with the given id exists at the database
    const check = await pool.query('SELECT deviceid FROM device WHERE deviceid = $1', [deviceid])
    if (check.rows.length === 0) {
      errorMsg.error = `Device with given id (${deviceid}) was not found`
      return res.status(404).json(errorMsg)
    }
    const { rows } = await pool.query(sql, [deviceid])
    return res.status(200).json(rows)
  } catch (err) {
    errorMsg.error = err
    return res.status(500).json(errorMsg)
  }
}

/**
 * Delete a maintenance task from the database that matches the given id.
 * 
 * @param {Object} req is express request object
 * @param {Object} res is express response object
 */
const deleteTask = async (req, res) => {
  const sql = 'DELETE FROM task WHERE taskid = $1 returning *'
  const taskid = req.params.id
  try {
    const { rows } = await pool.query(sql, [taskid])
    if (rows.length === 1) {
      successMsg.data = rows[0]
      return res.status(200).json(successMsg)
    } else {
      errorMsg.error = `Task with given id (${taskid}) was not found`
      return res.status(404).json(errorMsg)
    }
  } catch (err) {
    errorMsg.error = err
    return res.status(500).json(errorMsg)
  }
}

/**
 * Create and return the sql query for the updateTask-function
 * 
 * @param {Object} cols is a req.body object with some key-pair values
 */
const updateQuery = (cols) => {
  const sql = ['UPDATE task SET']
  const set = []
  let i = 1
  // Allow only specific keys that match the ones allowed in UPDATE-query
  Object.keys(cols).forEach((key) => {
    if (key === 'descr' || key === 'prio' || key === 'mode') {
      set.push(`${key} = $${i++}`)
    }
  })
  sql.push(set.join(', '))
  sql.push(`WHERE taskid = $${i} returning *`)
  return sql.join(' ')
}

/**
 * Update the column values of a single maintenance task. Columns
 * that can be updated are 'descr', 'prio' and 'mode'
 * 
 * @param {Object} req is express request object
 * @param {Object} res is express response object
 */
const updateTask = async (req, res) => {
  const taskid = req.params.id
  const sql = updateQuery(req.body)
  const values = []
  Object.keys(req.body).forEach((key) => {
    if (key === 'descr' || key === 'prio' || key === 'mode') {
      values.push(req.body[key])
    }
  })
  values.push(taskid)
  try {
    const { rows } = await pool.query(sql, values)
    if (!rows[0]) {
      errorMsg.error = `Task with given id ${taskid} was not found`
      return res.status(404).json(errorMsg)
    }
    successMsg.data = rows
    return res.status(200).json(successMsg)
  } catch (err) {
    errorMsg.error = err
    return res.status(500).json(errorMsg)
  }
}

pool.on('remove', () => {
  console.log('Client removed from database!')
})

// Export the functions
module.exports = {
  addTask,
  getAllTasks,
  getTaskById,
  getTasksByDevice,
  deleteTask,
  updateTask
}
