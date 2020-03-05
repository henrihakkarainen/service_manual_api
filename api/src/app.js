const express = require('express')
const helmet = require('helmet')
const app = express()

const taskRouter = require('./routes/taskRoutes')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())

app.use('/api', taskRouter)

const port = process.env.port || 3000
app.listen(port, () => {
  console.log(`Server listening on port ${port}!`)
})
