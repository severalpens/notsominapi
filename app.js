require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sqlQuery, sqlNonQuery } = require('./utils/sqldb');
const  EsContext = require('./utils/EsContext');
const allIndexDocsRouter = require('./routes/allIndexDocs');
const testResultsRouter = require('./routes/testResults');
const buildQuery = require('./buildQuery');
const { prepareStringForSql } = require('./utils/helpers');
const esContext = new EsContext();

var app = express();
app.use(cors());
app.options('*', cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var indexRouter = require('./routes/index');
var endpointRouter = require('./routes/endpoints');

app.use('/', indexRouter);
app.use('/endpoints', endpointRouter);
app.use('/allIndexDocs', allIndexDocsRouter);
app.use('/testResults', testResultsRouter);

//await axios.get(`${elasticsearchProxyUri}/GetExpectedResults?search_id=${search_id}`)
app.get('/GetExpectedResults', async function (req, res) {
  const search_id = req.query.search_id;
  const sql = `SELECT * FROM dim.ExpectedResults WHERE search_id = '${search_id}';`;
  const result = await sqlQuery(sql);
  res.send(result);
});

app.post('/submitAssessment', async function (req, res) {
  const { appAssessment, appRevisedOrder } = req.body;
  const sql = `INSERT INTO app.Assessments (search_id, query_name, search_term, author_name, comments,timestamp)
    VALUES ('${appAssessment.search_id}', '${appAssessment.query_name}', '${prepareStringForSql(appAssessment.search_term)}', '${appAssessment.author_name}', '${prepareStringForSql(appAssessment.comments)}',SYSDATETIMEOFFSET());`;
  await sqlNonQuery(sql);
  for (const result of appRevisedOrder) {
    const sql2 = `insert into app.RevisedOrder (search_id, query_name, search_term, author_name, pos, fragmenttitle, timestamp)
      VALUES ('${appAssessment.search_id}', '${appAssessment.query_name}', '${prepareStringForSql(appAssessment.search_term)}', '${appAssessment.author_name}', ${result.pos}, '${prepareStringForSql(result.fragment_title)}', SYSDATETIMEOFFSET());`;
    await sqlNonQuery(sql2);
  }
  res.send('Assessment submitted');
});


app.get('/getAssessments', async function (req, res) {
  const sql = 'SELECT * FROM tst.ManualReviews;';
  const result = await sqlQuery(sql);
  res.send(result);
});

app.get('/GetSearchQueryTestSet', async function (req, res) {
  const sql = `SELECT distinct  search_id,  search_term FROM dim.ExpectedResults;`;
  const result = await sqlQuery(sql);
  res.send(result);
});

// post endpoint using format: POST /:indexName/_search
app.post('/:indexName/_all', async function (req, res, next) {
  if (await esContext.verifyClientConnection()) {
    const result = await esContext.client.search({
      index: req.params.indexName,
      body: {
        query: {
          match_all: {}
        },
        size: 500,
        _source: [
          "uuid",
          "resultType",
          "fragmentTitle",
          "url",
          "shortDescription",
          "faqShortAnswer"
        ]
    }
    });
    res.send(result);
  }
  else {
    res.send('Failed to connect to ElasticSearch');
  }
});




// post endpoint using format: POST /:indexName/_search
app.post('/:indexName/_search', async function (req, res, next) {
  const indexName = req.params.indexName;
  const query_name = req.body.queryName;
  const search_term = req.body.searchTerm;
  const query = buildQuery( query_name, search_term);
  if (await esContext.verifyClientConnection()) {
    const result = await esContext.client.search({
      index: req.params.indexName,
      body: {
        query: query,
        // size: 3,
        _source: [
          "uuid",
          "resultType",
          "fragmentTitle",
          "url",
          "shortDescription",
          "faqShortAnswer"
        ]
    }
    });
    res.send(result);
  }
  else {
    res.send('Failed to connect to ElasticSearch');
  }
});


app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
