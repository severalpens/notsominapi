const sql = require('mssql');

const config = {
    user: 'scbadmin', // better stored in an app setting such as process.env.DB_USER
    password: 'ESResearch1', // better stored in an app setting such as process.env.DB_PASSWORD
    server: 'scb.database.windows.net', // better stored in an app setting such as process.env.DB_SERVER
    port: 1433, // optional, defaults to 1433, better stored in an app setting such as process.env.DB_PORT
    database: 'scb', // better stored in an app setting such as process.env.DB_NAME
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
}

console.log("Starting...");



async function connectAndNonQuery(qry){
    try {
        var poolConnection = await sql.connect(config);
        await poolConnection.request().query(qry);
        console.log("New record inserted.");

    } catch (err) {
        console.error(err.message);
    }
}

async function connectAndQuery(qry){
    try {
        var poolConnection = await sql.connect(config);
        const result = await poolConnection.request().query(qry);
        return result.recordset;
    } catch (err) {
        console.error(err.message);
    }
}

module.exports =     {connectAndQuery, connectAndNonQuery}
