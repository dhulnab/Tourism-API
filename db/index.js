const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.CONNECTION_KEY,
  max: 20,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 20000,
});

pool
  .connect()
  .then(() => console.log("Connected..."))
  .catch((e) => console.log("Error:doesn't connect to database", e));

module.exports = pool;
