require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const { sqlQuery, sqlNonQuery } = require('./utils/sqldb');
const  EsContext = require('./utils/EsContext');
const allIndexDocsRouter = require('./routes/allIndexDocs');
const testResultsRouter = require('./routes/testResults');

var app = express();
app.use(cors());
app.options('*', cors());


const esContext = new EsContext();

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


app.get('/regenerateAutomatedTestResults', async function (req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  let dt = new Date();
  let melbourneTime = new Date(dt.toLocaleString("en-US", { timeZone: "Australia/Melbourne" }));
  let insert_date = melbourneTime.toISOString();
  const timestampSuffix = `${melbourneTime.getFullYear()}${String(melbourneTime.getMonth() + 1).padStart(2, '0')}${String(melbourneTime.getDate()).padStart(2, '0')}${String(melbourneTime.getHours()).padStart(2, '0')}${String(melbourneTime.getMinutes()).padStart(2, '0')}${String(melbourneTime.getSeconds()).padStart(2, '0')}`;
  await sqlNonQuery(`select * into archive.AutomatedTestResults${timestampSuffix} from tst.AutomatedTestResults;`);
  await sqlNonQuery(`truncate table tst.AutomatedTestResults;`);

  const searchQueryTestSet = await sqlQuery('SELECT * FROM tst.SearchQueryTestSet;');
  for (const searchQueryTest of searchQueryTestSet) {
    const { Id, search_id, search_term, expected_results } = searchQueryTest;
    const result = await esContext.client.search({
      index: 'dummy_index',
      body: {
        query:   {
          "bool": {
            "should": [
              {
                "sparse_vector": {
                  "query": search_term,
                  "field": "fragmentTitleEmbedding",
                  "inference_id": ".elser_model_2",
                  "boost": 1
                }
              },
              {
                "sparse_vector": {
                  "query": search_term,
                  "field": "faqShortAnswerEmbedding",
                  "inference_id": ".elser_model_2",
                  "boost": 1
                }
              },
              {
                "sparse_vector": {
                  "query": search_term,
                  "field": "shortDescriptionEmbedding",
                  "inference_id": ".elser_model_2",
                  "boost": 1
                }
              },
              {
                "multi_match": {
                  "query": search_term,
                  "fields": ["fragmentTitle", "shortDescription", "faqShortAnswer"],
                  "boost": 4
                }
              }
            ]
          }
        },
        size: 3,
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

    let result_id = 0;
    let isMatch = "";

    for (const hit of result.hits.hits) {
      result_id++;
      const { _source, _score } = hit;
      const { resultType, fragmentTitle, shortDescription, faqShortAnswer } = _source;
      const title = fragmentTitle ? fragmentTitle : '';
      const type = resultType ? resultType : '';
      const description = shortDescription ? shortDescription : '';
      const answer = faqShortAnswer ? faqShortAnswer : '';
      const tmpIsMatch = expected_results.includes(title);
      if (tmpIsMatch && result_id === 1) {
        isMatch = "3";
      }
      if (tmpIsMatch && result_id === 2 && isMatch == "") {
        isMatch = "2";
      }
      if (tmpIsMatch && result_id === 3 && isMatch == "") {
        isMatch = "1";
      }
      if (!tmpIsMatch && result_id === 3 && isMatch == "") {
        isMatch = "0";
      }

      const addTestResultSql = `
            INSERT INTO tst.AutomatedTestResults  
            VALUES ('${search_id}','${result_id}', '${insert_date}', '${search_term.replace(/'/g, `"`)}', '${expected_results.replace(/'/g, `"`)}','${isMatch}', '${title.replace(/'/g, `"`)}', '${type}', '${description.replace(/'/g, `"`)}', '${answer.replace(/'/g, `"`)}', '${_score}');
          `;


      await sqlNonQuery(addTestResultSql);
      await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_quality = '${isMatch}' WHERE search_id = '${search_id}';`);
      await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET update_date = '${insert_date}' WHERE search_id = '${search_id}';`);
      
      switch (result_id) {
        case 1:
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_1_title = '${title.replace(/'/g, "''")}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_1_type = '${type}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_1_short_description = '${description.replace(/'/g, "''")}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_1_faq_short_answer = '${answer.replace(/'/g, "''")}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_1_es_score = '${_score}' WHERE search_id = '${search_id}';`);
          break
        case 2:
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_2_title = '${title.replace(/'/g, "''")}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_2_type = '${type}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_2_short_description = '${description.replace(/'/g, "''")}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_2_faq_short_answer = '${answer.replace(/'/g, "''")}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_2_es_score = '${_score}' WHERE search_id = '${search_id}';`);
          break;
        case 3:
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_3_title = '${title.replace(/'/g, "''")}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_3_type = '${type}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_3_short_description = '${description.replace(/'/g, "''")}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_3_faq_short_answer = '${answer.replace(/'/g, "''")}' WHERE search_id = '${search_id}';`);
          await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET result_3_es_score = '${_score}' WHERE search_id = '${search_id}';`);
          break;
        default:
          break;
      }

      // Send update to client
      res.write(`data: ${title}\n\n`);
    }
  }
  res.write('data: completed\n\n');
  res.end();
});

app.post('/submitAssessment', async function (req, res) {
  const { sql, search_term } = req.body;
  console.log(sql);
  await sqlNonQuery(sql);
  await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET assessed = '${new Date().toISOString()}' WHERE search_term = '${search_term}';`);
  res.send('Assessment submitted');
});


app.get('/getAssessments', async function (req, res) {
  const sql = 'SELECT * FROM tst.ManualReviews;';
  const result = await sqlQuery(sql);
  res.send(result);
});

app.get('/GetSearchQueryTestSet', async function (req, res) {
  const sql = `SELECT 
distinct id, search_id,  search_term, expected_results, result_quality, assessed 
FROM tst.SearchQueryTestSet 
where result_quality = '0'
and expected_results  in (select fragmentTitle from src.DummyIndex);
`;
  const result = await sqlQuery(sql);
  res.send(result);
});


app.post('/search', async function (req, res) {
  try {
    if (!(await esContext.verifyClientConnection())) {
      return res.status(500).json({ error: 'Failed to connect to Elasticsearch' });
    }

    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const result = await esContext.client.search({
      index: 'dummy_index',
      body: {
        query: {
          multi_match: {
            query: query,
            fields: [
              "fragmentTitle",
              "shortDescription",
              "faqShortAnswer",
              "faqLongAnswer"
            ]
          }
        },
        size: 3,
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
    res.json(result);
  } catch (error) {
    console.error('Elasticsearch search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// post endpoint using format: POST /:indexName/_search
app.post('/:indexName/_search', async function (req, res, next) {
  if (await esContext.verifyClientConnection()) {
    const result = await esContext.client.search({
      index: req.params.indexName,
      body: {
        query: {
          multi_match: {
            query: req.body.query,
            fields: ["fragmentTitleSuggest"]
          }
        },
        size: 3,
        _source: ["fragmentTitle", "shortDescription", "url"]
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
