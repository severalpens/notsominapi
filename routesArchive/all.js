
var express = require('express');
var router = express.Router();
const  EsContext = require('../utils/EsContext');
const esContext = new EsContext();
const { sqlQuery, sqlNonQuery } = require('../utils/sqldb');


router.get('/', async function (req, res) {
  let dt = new Date();
  let dtYear = dt.getFullYear();
  let dtMonth = String(dt.getMonth() + 1).padStart(2, '0');
  let dtDay = String(dt.getDate()).padStart(2, '0');
  let dtHour = String(dt.getHours()).padStart(2, '0');
  let dtMinute = String(dt.getMinutes()).padStart(2, '0');
  let dtSecond = String(dt.getSeconds()).padStart(2, '0');
  let insert_date = `${dtYear}-${dtMonth}-${dtDay} ${dtHour}:${dtMinute}:${dtSecond}`;
  
    if (!(await esContext.verifyClientConnection())) {
      return res.status(500).json({ error: 'Failed to connect to Elasticsearch' });
    }
  
    const results = await esContext.client.search({
      index: 'dummy_index',
      body: {
        query: {
          match_all: {}
        },
        size: 500,
        _source: [
          // "uuid",
          // "resultType",
          "fragmentTitle",
          // "url",
          // "shortDescription",
          // "faqShortAnswer"
        ]
      }
    });

    for (const result of results.hits.hits) {
      const fragmentTitle = result._source.fragmentTitle.replace(/'/g, "''");
    
      await sqlNonQuery(`INSERT INTO src.dummyIndex (fragmentTitle, Timestamp) VALUES ('${fragmentTitle}','${insert_date}');`);
      
    }
    res.json(results);
  });
  
  
  router.post('/all', async function (req, res) {
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

  module.exports = router;
  
  