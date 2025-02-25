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

const client = new Client({
    node: 'https://7441222d1c12456cae009f0c5f878e45.westus2.azure.elastic-cloud.com:443',
    auth: {
        apiKey: 'NXdVZFA1VUJSa3k2ZlUzekwtUnU6OE04WGhRMFhUUm11NDRKSUlvdy1WQQ=='
    }
});


const verifyClientConnection = async () => {
  const resp = await client.info();
  let isConnected = false;
  if (resp.name) {
      console.log(chalk.green('Connected to ElasticSearch')); // Use chalk to color the output
      isConnected = true;
  } else {
      console.log(chalk.red('Failed to connect to ElasticSearch')); // Use chalk to color the error output
      isConnected = false;
  }
  return isConnected;
};



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

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



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
