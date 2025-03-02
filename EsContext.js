require('dotenv').config();
const fs = require('fs');
const { Client } = require('@elastic/elasticsearch');
const chalk = require('chalk');


//Connection Settings Lookup IDs-----------------------------------
const cnType = 'api'; // 'api' or 'user'
const clusterId = 1; // (1 =  https://d8ab8a92...)
const userId = 1; // (1 =  ibm_cloud_ad...)
const apiKeyId = 1; // (1 =  dummy_key1)
const indexId = 1; // (1 =  dummy_index)
//-----------------------------------------------

class EsContext {
    dbContext = null;
    apiKeyProps = { url: '', key: '' };
    userProps = { url: '', username: '', password: '' };
    client = null;
    
    getAllData = async (indexName) => {
      const result = await this.client.search({
        index: indexName,
        body: {
          query: {
            match_all: {}
          }
        }
      });
      fs.writeFileSync('data.json', JSON.stringify(result.hits.hits));
      console.log('Data written to data.json');  
    }

    setConnectionDetails = async () => {
        if (cnType === 'api') {
            this.apiKeyProps = await this.dbContext.getApiKey(clusterId, apiKeyId);
            this.client = new Client({
                node: this.apiKeyProps.url,
                auth: {
                    apiKey: this.apiKeyProps.key
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        }

        if (cnType === 'user') {
            this.userProps = await this.dbContext.getUser(clusterId, userId);

            client = new Client({
                node: this.userProps.url,
                auth: {
                    username: this.userProps.username,
                    password: this.userProps.password
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        }
    }

    verifyClientConnection = async () => {
        let isConnected = false;
        try {
            const resp = await this.client.info();
            cnType === 'user' ? console.log(chalk.green(`Connected to ElasticSearch user: ${this.userProps.username}`)) :
                console.log(chalk.green(`Connected to ElasticSearch using api: ${this.apiKeyProps.key.substring(0, 6)}..`));
            isConnected = true;
            return isConnected;
        }
        catch (e) {
            cnType === 'user' ? console.log(chalk.red(`Failed to connect to ElasticSearch using user credentials: ${JSON.stringify(this.userProps)}`)) :
                console.log(chalk.red(`Failed to connect to ElasticSearch using api credentials: ${JSON.stringify(this.apiKeyProps)}`));
            console.log(e);
            isConnected = false;
            return isConnected;
        }
    };

    init = async () => {
        await this.setConnectionDetails();
        await this.verifyClientConnection();
    }
    constructor(dbContext) {
        this.dbContext = dbContext;
        this.init();
    }
}

module.exports = EsContext;