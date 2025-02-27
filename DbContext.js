var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var config = {
    server: 'scb.database.windows.net',  //update me
    authentication: {
        type: 'default',
        options: {
            userName: 'scbadmin', //update me
            password: 'ESResearch1'  //update me
        }
    },
    options: {
        // If you are on Microsoft Azure, you need encryption:
        encrypt: true,
        database: 'scb'  //update me
    }
};

var connection = new Connection(config);
connection.on('connect', function (err) {
    console.log("Connected");
    
});

class DbContext {
    constructor() {
        connection.connect();
    }
     executeStatement = async (sqlQuery) => {
        var request = new Request(
            sqlQuery
            , function (err) {
                if (err) {
                    console.log(err);
                }
            });
        var result = "";
        request.on('row', function (columns) {
            columns.forEach(function (column) {
                if (column.value === null) {
                    console.log('NULL');
                } else {
                    result += column.value + " ";
                }
            });
            console.log(result);
            result = "";
        });
    
        request.on('done', function (rowCount, more) {
            console.log(rowCount + ' rows returned');
        });
    
        // Close the connection after the final event emitted by the request, after the callback passes
        request.on("requestCompleted", function (rowCount, more) {
            connection.close();
        });
        connection.execSql(request);
    }

}

module.exports = DbContext;