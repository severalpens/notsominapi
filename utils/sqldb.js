require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER, 
  password: process.env.DB_PASSWORD, 
  server: process.env.DB_SERVER, 
  port: 1433, 
  database: process.env.DB_NAME, 
  authentication: {
    type: 'default'
  },
  options: {
    encrypt: true
  }
}

async function sqlNonQuery(qry) {
  try {
    var poolConnection = await sql.connect(dbConfig);
    await poolConnection.request().query(qry);
    console.log("New record inserted.");

  } catch (err) {
    console.error(err.message);
    console.log(qry);
  }
}

async function sqlQuery(qry) {
  try {
    var poolConnection = await sql.connect(dbConfig);
    const result = await poolConnection.request().query(qry);
    return result.recordset;
  } catch (err) {
    console.error(err.message);
  }
}

module.exports = {
  sqlQuery,
  sqlNonQuery
};