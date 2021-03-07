const pool = require('../db/pool')

const successMsg = { status: 'success' }
const errorMsg = { status: 'error' }

pool.on('connect', () => {
  console.log('Client connected to database!')
})

/**
 * Return a matching error message for invalid input field values when trying to
 * create or update tasks in the database.
 * 
 * Method is called on addTask and updateTask functions if an error is catched when
 * trying to write to database but some values given to the query are incorrect.
 * 
 * @param {Object} error is error object
 */
const getErrorMsgAndStatus = (error) => {
  if (error.code == 23514) {
    switch (error.constraint) {
      case 'task_mode_check':
        return {
          status: 400,
          msg: 'Invalid value on field \'mode\', allowed values are: open, done'
        }
      case 'task_priority_check':
        return {
          status: 400,
          msg: 'Invalid value on field \'priority\', allowed values are: critical, important, slight'
        }
      default:
        return {
          status: 400,
          msg: 'Check input values'
        }
    }
  } else if (error.code == 23503) {
    return {
      status: 400,
      msg: 'Invalid value on field deviceid: device with given deviceid was not found'
    }
  } else {
    return {
      status: 500,
      msg: 'Unknown server error occurred'
    }
  }
}

/**
 * Add a new maintenance task to the database.
 * 
 * @param {Object} req is express request object
 * @param {Object} res is express response object
 */
const addTask = async (req, res) => {
  const { description, priority, mode, deviceid } = req.body
  // Check that all the required fields have been given in request.body and values are not empty
  if (!description || !priority || !mode || !deviceid) {
    errorMsg.error = 'Required fields are: description, priority, mode, deviceid and those values can\'t be empty'
    return res.status(400).json(errorMsg)
  }
  const sql = `INSERT INTO task (description, priority, mode, deviceid)
               VALUES ($1, LOWER($2), LOWER($3), $4)
               returning *;`
  const values = [description, priority, mode, deviceid]
  try {
    const { rows } = await pool.query(sql, values)
    successMsg.data = rows[0]
    return res.status(201).json(successMsg)
  } catch (err) {
    const errObject = getErrorMsgAndStatus(err)
    errorMsg.error = errObject.msg
    return res.status(errObject.status).json(errorMsg)
  }
}

/**
 * List all maintenance tasks from the database. DeviceID can be given as a
 * query parameter and if present, return only those tasks that belong to the
 * matching device.
 * 
 * @param {Object} req is express request object
 * @param {Object} res is express response object
 */
const getAllTasks = async (req, res) => {
  const { deviceId } = req.query
  try {
    if (deviceId) {
      // Check that query parameter deviceId is a number (integer)
      if (!Number.isInteger(+deviceId)) {
        errorMsg.error = 'Invalid query parameter deviceId: value must be integer'
        return res.status(400).json(errorMsg)
      }
      // Check that device with given id exists in the database
      const check = await pool.query('SELECT deviceid FROM device WHERE deviceid = $1', [deviceId])
      if (check.rows.length === 0) {
        errorMsg.error = `Device matching query parameter deviceId (${deviceId}) was not found`
        return res.status(404).json(errorMsg)
      }
      const sql = `SELECT taskid, entry_date, description, priority, mode, deviceid
                   FROM task
                   WHERE deviceid = $1
                   ORDER BY CASE WHEN LOWER(priority) = 'critical' THEN '1'
                                 WHEN LOWER(priority) = 'important' THEN '2'
                                 ELSE '3'
                            END ASC, entry_date DESC`
      
      const { rows } = await pool.query(sql, [deviceId])
      return res.status(200).json(rows)
    } else {
      const sql = `SELECT taskid, entry_date, description, priority, mode, deviceid
                   FROM task
                   ORDER BY CASE WHEN LOWER(priority) = 'critical' THEN '1'
                                 WHEN LOWER(priority) = 'important' THEN '2'
                                 ELSE '3'
                            END ASC, entry_date DESC`

      const { rows } = await pool.query(sql)
      return res.status(200).json(rows)
    }
  } catch (err) {
    errorMsg.error = 'Unknown server error occurred'
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
  const sql = `SELECT taskid, entry_date, description, priority, mode, deviceid
               FROM task
               WHERE taskid = $1`
  const taskid = req.params.id
  try {
    const { rows } = await pool.query(sql, [taskid])
    if (rows.length === 0) {
      errorMsg.error = `Task with given id (${taskid}) was not found`
      return res.status(404).json(errorMsg)
    }
    return res.status(200).json(rows[0])
  } catch (err) {
    errorMsg.error = 'Unknown server error occurred, check that id is a number'
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
    errorMsg.error = 'Unknown server error occurred, check that id is a number'
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
    if (key === 'description' || key === 'priority' || key === 'mode') {
      set.push(`${key} = $${i++}`)
    }
  })
  sql.push(set.join(', '))
  sql.push(`WHERE taskid = $${i} returning *`)
  return sql.join(' ')
}

/**
 * Update the column values of a single maintenance task. Columns
 * that can be updated are 'description', 'priority' and 'mode'
 * 
 * @param {Object} req is express request object
 * @param {Object} res is express response object
 */
const updateTask = async (req, res) => {
  const taskid = req.params.id
  if (Object.keys(req.body).length === 0) {
    return res.status(204).json({})
  }
  const sql = updateQuery(req.body)
  const values = []
  Object.keys(req.body).forEach((key) => {
    if (key === 'description' || key === 'priority' || key === 'mode') {
      if (req.body[key]) {
        values.push(req.body[key])
      } else {
        errorMsg.error = `Invalid value on field '${key}', value can't be empty`
        return res.status(400).json(errorMsg)
      }      
    }
  })
  values.push(taskid)
  try {
    const { rows } = await pool.query(sql, values)
    if (!rows[0]) {
      errorMsg.error = `Task with given id (${taskid}) was not found`
      return res.status(404).json(errorMsg)
    }
    successMsg.data = rows[0]
    return res.status(200).json(successMsg)
  } catch (err) {
    const errObject = getErrorMsgAndStatus(err)
    errorMsg.error = errObject.msg
    return res.status(errObject.status).json(errorMsg)
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
  deleteTask,
  updateTask
}
