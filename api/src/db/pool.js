const { Pool } = require('pg')

const pool = new Pool({
  user: 'worker',
  host: 'db',
  database: 'factory_db',
  password: 'worker'
})

module.exports = pool
