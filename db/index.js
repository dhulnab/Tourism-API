const { Client } = require("pg");
require("dotenv").config();

const client = new Client({
  connectionString: process.env.CONNECTION_KEY,
});
client
  .connect()
  .then(() => console.log("Connected..."))
  .catch((e) => console.log("Error:doesn't connect to database", e));

module.exports = client;
