require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { Client } = require('@elastic/elasticsearch');
const chalk = require('chalk');
const cors = require('cors');
const bodyParser = require('body-parser');
var DbContext = require('./DbContext');
const dbContext = new DbContext();

const client = new Client({
    node: process.env.ELASTICSEARCH_URL,
    auth: {
        apiKey: process.env.ELASTICSEARCH_API_KEY
    }
});

const connectToAzureSql = async () => {
  const sqlQuery = `
            select
                ClusterId,
                Name,
                Description,
                KibanaUrl,
                EndpointUrl,
                EndpointUrl2
            from Clusters;
        `;
   await dbContext.executeStatement(sqlQuery);
}
connectToAzureSql();

const verifyClientConnection = async () => {
  const resp = await client.info();
  let isConnected = false;
  if (resp.name) {
      console.log(chalk.green('Connected to ElasticSearch'));
      isConnected = true;
  } else {
      console.log(chalk.red('Failed to connect to ElasticSearch'));
      isConnected = false;
  }
  return isConnected;
};

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/search', async function (req, res, next) {
  if (verifyClientConnection()) {
      const reqBody = req.body;
      console.log('reqBody', reqBody);
      const result = await client.search({
          index: 'main',
          body: reqBody
      });
      res.send(result);
  }
  else {
      res.send('Failed to connect to ElasticSearch');
  }
});

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
