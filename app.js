require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const { Client } = require('@elastic/elasticsearch');
const chalk = require('chalk');

var app = express();
app.use(cors());
app.options('*', cors());
const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER, // better stored in an app setting such as process.env.DB_USER
  password: process.env.DB_PASSWORD, // better stored in an app setting such as process.env.DB_PASSWORD
  server: process.env.DB_SERVER, // better stored in an app setting such as process.env.DB_SERVER
  port: 1433, // optional, defaults to 1433, better stored in an app setting such as process.env.DB_PORT
  database: process.env.DB_NAME, // better stored in an app setting such as process.env.DB_NAME
  authentication: {
    type: 'default'
  },
  options: {
    encrypt: true
  }
}

async function sqlQuery(qry) {
  try {
    var poolConnection =  sql.connect(dbConfig);
    const result = await poolConnection.request().query(qry);
    return result.recordset;
  } catch (err) {
    console.error(err.message);
  }
  finally {
    sql.close();
  }
}

async function sqlNonQuery(qry) {
  try {
    var poolConnection =  sql.connect(dbConfig);
    await poolConnection.request().query(qry);
    console.log("New record inserted.");

  } catch (err) {
    console.error(err.message);
    console.log(qry);
  }
  finally {
    sql.close();
  }
}



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

// app.get('/', async function (req, res) {
//   res.send("Welcome to notsominapi")
// });
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var endpointRouter = require('./routes/endpoints');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/endpoints', endpointRouter);

app.get('/runTests', async function (req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  let tm = new Date();
  let insert_date = tm.toISOString();
  const timestampSuffix = `${tm.getFullYear()}${String(tm.getMonth() + 1).padStart(2, '0')}${String(tm.getDate()).padStart(2, '0')}${String(tm.getHours()).padStart(2, '0')}${String(tm.getMinutes()).padStart(2, '0')}${String(tm.getSeconds()).padStart(2, '0')}`;
  await sqlNonQuery(`insert into archive.SearchQueryTestSet${timestampSuffix} select * from tst.SearchQueryTestSet;`);
  await sqlNonQuery(`truncate table tst.AutomatedTestResults;`);

  const searchQueryTestSet = await sqlQuery('SELECT * FROM tst.SearchQueryTestSet;');
  for (const searchQueryTest of searchQueryTestSet) {
    const { Id, search_id, search_term, expected_results } = searchQueryTest;
    const result = await esContext.client.search({
      index: 'dummy_index',
      body: {
        query: {
          multi_match: {
            query: search_term,
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

      const sql = `
            INSERT INTO tst.AutomatedTestResults  
            VALUES ('${search_id}','${result_id}', '${insert_date}', '${search_term.replace(/'/g, `"`)}', '${expected_results.replace(/'/g, `"`)}','${isMatch}', '${title.replace(/'/g, `"`)}', '${type}', '${description.replace(/'/g, `"`)}', '${answer.replace(/'/g, `"`)}', '${_score}');
          `;

      await sqlNonQuery(sql);

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
      res.write(`data: ${JSON.stringify({ search_id, result_id, title, type, description, answer, _score, isMatch })}\n\n`);
    }
  }
  res.write('data: completed\n\n');
  res.end();
});

app.post('/submitAssessment', async function (req, res) {
  const { sql, search_term } = req.body;
  await sqlNonQuery(sql);
  await sqlNonQuery(`UPDATE tst.SearchQueryTestSet SET assessed = '${new Date().toISOString()}' WHERE search_term = '${search_term}';`);
  // await connectAndNonQuery(`update t1 set t1.search_id = t2.search_id from Assessments t1 jointst.SearchQueryTestSet t2 on t1.search_term = t2.search_term  AND search_term = '${search_term}';`);
  res.send('Assessment submitted');
});

app.get('/getAssessments', async function (req, res) {
  const sql = 'SELECT * FROM assessments;';
  const result = await sqlQuery(sql);
  res.send(result);
});


app.get('/getRandomQuestions', async function (req, res) {
  const sql = 'SELECT distinct id, search_term, expected_result FROM archive.randomQuestions  order by id;';
  const result = await sqlQuery(sql);
  res.send(result);
});

app.get('/GetSearchQueryTestSet', async function (req, res) {
  const sql = 'SELECT distinct id, search_id,  search_term, expected_results, result_quality, assessed FROM tst.SearchQueryTestSet  order by id;';
  const result = await sqlQuery(sql);
  res.send(result);
});

app.get('/test1', async function (req, res) {
  try {
    if (!(await esContext.verifyClientConnection())) {
      return res.status(500).json({ error: 'Failed to connect to Elasticsearch' });
    }

    const testQuestions = fs.readJsonSync('./testQuestions.json');

    for (const testQuestion of testQuestions) {
      const answers = await esContext.client.search({
        index: 'dummy_index',
        body: {
          query: {
            multi_match: {
              query: testQuestion.Question,
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

      for (const answer of answers.hits.hits) {
        console.log('answer:', answer);
        var questionId = testQuestion.Id;
        var question = testQuestion.Question.replace(/'/g, "''");
        var faqShortAnswer = answer._source.faqShortAnswer ? answer._source.faqShortAnswer.replace(/'/g, "''") : '';
        var shortDescription = answer._source.shortDescription ? answer._source.shortDescription.replace(/'/g, "''") : '';
        var fragmentTitle = answer._source.fragmentTitle ? answer._source.fragmentTitle.replace(/'/g, "''") : '';
        var sql = `INSERT INTO testresults (QuestionId, Question, faqShortAnswer,shortDescription,fragmentTitle) VALUES ('${questionId}', '${question}', '${faqShortAnswer}', '${shortDescription}', '${fragmentTitle}');`;
        await sqlNonQuery(sql);

      }


    }



    res.send("test1 done");
  } catch (error) {
    console.error('Elasticsearch search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/baseline', async function (req, res) {
  try {
    if (!(await esContext.verifyClientConnection())) {
      return res.status(500).json({ error: 'Failed to connect to Elasticsearch' });
    }

    const result = await esContext.client.search({
      index: 'dummy_index',
      body: {
        query: {
          multi_match: {
            query: "how do i update my limit?",
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


app.post('/baseline', async function (req, res) {
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

app.get('/all', async function (req, res) {
  if (!(await esContext.verifyClientConnection())) {
    return res.status(500).json({ error: 'Failed to connect to Elasticsearch' });
  }

  const result = await esContext.client.search({
    index: 'dummy_index',
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
  res.json(result);
});


app.post('/all', async function (req, res) {
  if (!(await esContext.verifyClientConnection())) {
    return res.status(500).json({ error: 'Failed to connect to Elasticsearch' });
  }

  const result = await esContext.client.search({
    index: 'dummy_index',
    body: {
      query: {
        multi_match: {
          query: req.body.query,
          fields: [
            "fragmentTitle",
            "shortDescription",
            "faqShortAnswer",
            "faqLongAnswer"
          ]
        }
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
  res.json(result);
});


app.post('/completionsuggestor', async function (req, res, next) {
  if (await esContext.verifyClientConnection()) {
    const result = await esContext.client.search({
      index: 'dummy_index',
      body: {
        "suggest": {
          "autocomplete": {
            "prefix": req.body.query,
            "completion": {
              "field": "fragmentTitleSuggest",
              "size": 3,
              "skip_duplicates": true
            }
          }
        },
        "_source": ["fragmentTitle", "shortDescription", "url"]
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


// Proxy search: Client sends the full json body as if it was sending directly to ElasticSearch
app.use('/proxysearch', async function (req, res, next) {
  if (await esContext.verifyClientConnection()) {
    const reqBody = req.body;
    const result = await esContext.client.search({
      index: 'main',
      body: reqBody
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


app.get('/uploadfaqstosqldb', async function (req, res, next) {
  const faqs = await fs.readJson('./faqs.json');
  await sqlNonQuery('TRUNCATE TABLE faqs;');

  for (const faq of faqs) {
    const question = faq.Question.replace(/'/g, "''");
    const answer = faq.Answer.replace(/'/g, "''").slice(0, 4000);
    const sqlQuery = `INSERT INTO faqs (Question, Answer) VALUES ('${question}', '${answer}');`;
    await sqlNonQuery(sqlQuery);
  }
  res.send('FAQs uploaded to SQL DB');
});


module.exports = app;
