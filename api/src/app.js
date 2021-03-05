const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const app = express()

const taskRouter = require('./routes/taskRoutes')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())
app.use(cors())

app.use('/api', taskRouter)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`)
})
