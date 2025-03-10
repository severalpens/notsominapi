require('dotenv').config();
const fs = require('fs-extra');
const { Client } = require('@elastic/elasticsearch');
const chalk = require('chalk');

class EsContext {
    userProps = {
      url: process.env.ELASTICSEARCH_URL,
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD
    };
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
  
      this.client = new Client({
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
  
    verifyClientConnection = async () => {
      let isConnected = false;
      try {
        const resp = await this.client.info();
        console.log(chalk.green(`Connected to ElasticSearch user: ${this.userProps.username}`));
        isConnected = true;
        return isConnected;
      }
      catch (e) {
        console.log(chalk.red(`Failed to connect to ElasticSearch using user credentials: ${JSON.stringify(this.userProps)}`));
        console.log(e);
        isConnected = false;
        return isConnected;
      }
    };
  
    init = async () => {
      await this.setConnectionDetails();
      await this.verifyClientConnection();
    }
    constructor() {
      this.init();
    }
  }

  module.exports = EsContext;
  