const { Pool } = require('pg')

// Init pool for database connections (these values should be moved to env variables)
const pool = new Pool({
  user: 'worker',
  host: 'db',
  database: 'factory_db',
  password: 'worker'
})

module.exports = pool
