const express = require('express')
const taskController = require('../controllers/taskController')

const router = express.Router()

router
  .route('/tasks')
  .post(taskController.addTask)
  .get(taskController.getAllTasks)

router
  .route('/tasks/:id')
  .put(taskController.updateTask)
  .get(taskController.getTaskById)
  .delete(taskController.deleteTask)

module.exports = router
