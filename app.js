require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
var DbContext = require('./DbContext');
const dbContext = new DbContext();
const EsContext = require('./EsContext');
const esContext = new EsContext(dbContext);
const fs = require('fs-extra');
const connectAndNonQuery = require('./MsSqlContext');
var app = express();
app.use(cors());

// app.use(cors({
//   origin: 'https://happy-bush-0ab015800.6.azurestaticapps.net', // Allow only your frontend
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   allowedHeaders: 'Content-Type,Authorization'
// }));

app.options('*', cors()); // Handle preflight requests

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
// submitAssessment payload:
// const body = {
//   input_query,
//   result1,
//   result2,
//   result3,
//   resultQuality, 
//   comments
// };
app.post('/submitAssessment', async function (req, res) {
  const { input_query, result1, result2, result3, resultQuality, comments } = req.body;
  console.log(req.body);
  
  const sql = `INSERT INTO assessments (input_query, result1, result2, result3, resultQuality, comments) VALUES ('${input_query}', '${result1}', '${result2}', '${result3}', '${resultQuality}', '${comments}');`;
  await connectAndNonQuery(sql);
  res.send('Assessment submitted');
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
