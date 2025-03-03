require('dotenv').config();
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var config = {
    server: 'scb.database.windows.net', 
    authentication: {
        type: 'default',
        options: {
            userName: process.env.AZURE_SQL_USER, 
            password: process.env.AZURE_SQL_PASSWORD 
        }
    },
    options: {
        // If you are on Microsoft Azure, you need encryption:
        encrypt: true,
        database: 'scb'  //update me
    }
};

class DbContext {
    constructor() {
        this.connection = new Connection(config);
        this.connection.on('connect', (err) => {
            if (err) {
                console.error('Connection error:', err);
            } else {
                console.log('Connected to Azure SQL scb database');
            }
        });
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.connection.on('connect', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
            this.connection.connect();
        });
    }

    async executeNonQuery(sqlQuery) {
        await this.connect();
        return new Promise((resolve, reject) => {
            var request = new Request(sqlQuery, (err) => {
                if (err) {
                    reject(err);
                }
            });

            request.on('requestCompleted', () => {
                this.connection.close();
                resolve();
            });

            this.connection.execSql(request);
        });
    }

    async executeStatement(sqlQuery) {
        await this.connect();
        return new Promise((resolve, reject) => {
            var request = new Request(sqlQuery, (err) => {
                if (err) {
                    reject(err);
                }
            });

            var result = [];
            request.on('row', (columns) => {
                var row = {};
                columns.forEach((column) => {
                    row[column.metadata.colName] = column.value;
                });
                result.push(row);
            });

            request.on('done', (rowCount, more) => {
                console.log(rowCount + ' rows returned');
            });

            request.on('requestCompleted', () => {
                this.connection.close();
                resolve(result);
            });

            this.connection.execSql(request);
        });
    }

    async getApiKey(clusterId, keyId) {
        var sqlQuery = `
            select top 1
                c.EndpointUrl,
                a.KeyValue
            from clusters c
            join ApiKeys a on c.ClusterId = a.ClusterId
            where c.clusterid = ${clusterId} ;
        `;
        console.log('sqlQuery', sqlQuery);
        
        const result = await this.executeStatement(sqlQuery);
        console.log('result', result);
        
        return result.length > 0 ? {url: result[0].EndpointUrl, key: result[0].KeyValue} : null;
    }


}

module.exports = DbContext;