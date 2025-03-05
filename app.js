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
            console.log(chalk.red(`Failed to connect to ElasticSearch using user credentials: ${JSON.stringify(this.userProps)}`)) ;
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


var app = express();
app.use(cors());
app.options('*', cors());
const sql = require('mssql');

const config = {
    user: process.env.AZURE_SQL_USER, // better stored in an app setting such as process.env.DB_USER
    password: process.env.AZURE_SQL_PASSWORD, // better stored in an app setting such as process.env.DB_PASSWORD
    server: process.env.AZURE_SQL_SERVER, // better stored in an app setting such as process.env.DB_SERVER
    port: 1433, // optional, defaults to 1433, better stored in an app setting such as process.env.DB_PORT
    database: process.env.AZURE_SQL_DATABASE, // better stored in an app setting such as process.env.DB_NAME
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
}


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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async function (req, res) {
  res.send("Welcome to notsominapi")
});

app.get('/runTests', async function (req, res) {
  let insert_date = new Date().toISOString();
  const sql = 'SELECT * FROM SearchQueryTestSet;';
  const searchQueryTestSet = await connectAndQuery(sql);
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
    for (const hit of result.hits.hits) {
      result_id++;
      const { _source, _score } = hit;
      const { resultType, fragmentTitle, shortDescription, faqShortAnswer } = _source;
      const title = fragmentTitle ? fragmentTitle.replace(/'/g, "''") : '';
      const type = resultType ? resultType.replace(/'/g, "''") : '';
      const description = shortDescription ? shortDescription.replace(/'/g, "''") : '';
      const answer = faqShortAnswer ? faqShortAnswer.replace(/'/g, "''") : '';
      const isMatch = expected_results.includes(title) ;

      const sql = `
INSERT INTO SearchQueryTestResults  
VALUES ('${search_id}','${result_id}', '${insert_date}', '${search_term}', '${expected_results}','${isMatch}', '${title}', '${type}', '${description}', '${answer}', '${_score}');
`;
      
      console.log(sql);

      await connectAndNonQuery(sql);
    }
  }
  res.send('completed');
});

app.post('/submitAssessment', async function (req, res) {
  const { sql } = req.body;
  console.log(sql);
  await connectAndNonQuery(sql);
  res.send('Assessment submitted');
});

app.get('/getAssessments', async function (req, res) {
  const sql = 'SELECT * FROM assessments;';
  const result = await connectAndQuery(sql);
  res.send(result);
});


app.get('/getRandomQuestions', async function (req, res) {
  const sql = 'SELECT distinct id, search_term, expected_result FROM randomQuestions where search_term not in (select distinct search_term from assessments) order by id;';
  const result = await connectAndQuery(sql);
  console.log(result);
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
        await connectAndNonQuery(sql);

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
  await dbContext.executeNonQuery('TRUNCATE TABLE faqs;');

  for (const faq of faqs) {
    const question = faq.Question.replace(/'/g, "''");
    const answer = faq.Answer.replace(/'/g, "''").slice(0, 4000);
    const sqlQuery = `INSERT INTO faqs (Question, Answer) VALUES ('${question}', '${answer}');`;
    await dbContext.executeNonQuery(sqlQuery);
  }
  res.send('FAQs uploaded to SQL DB');
});



module.exports = app;
