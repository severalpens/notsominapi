
var express = require('express');
var router = express.Router();
const  EsContext = require('../utils/EsContext');
const esContext = new EsContext();
const { sqlQuery, sqlNonQuery } = require('../utils/sqldb');
const { prepareStringForSql, getDate } = require('../utils/helpers');


router.get('/', async function (req, res) {
    const timestamp = getDate();
    if (!(await esContext.verifyClientConnection())) {
      return res.status(500).json({ error: 'Failed to connect to Elasticsearch' });
    }
    sqlNonQuery(`TRUNCATE TABLE fact.IndexDocs`);
    const results = await esContext.client.search({
      index: 'dummy_index',
      body: {
        query: {
          match_all: {}
        },
        size: 500,
        _source: [
          "fragmentTitleSuggest",
          "fragmentTitleSuggestIsTruncated",
          "fragmentTitle",
          "shortDescriptionEmbedding",
          "fragmentTitleEmbedding",
          "shortDescription",
          "model_id",          
          "uuid",
          "resultType",
          "url",
          "fragmentChannel",
          "tags"
                  ]
      }
    });

    for (const result of results.hits.hits) {
      const indexName = 'dummy_index';
      const fragmentTitle = prepareStringForSql(result._source.fragmentTitle);
      const shortDescription = prepareStringForSql(result._source.shortDescription);
      const fragmentTitleSuggest = prepareStringForSql(result._source.fragmentTitleSuggest);
      const fragmentTitleSuggestIsTruncated = result._source.fragmentTitleSuggestIsTruncated ? 1 : 0;
      const shortDescriptionEmbedding = prepareStringForSql(result._source.shortDescriptionEmbedding);
      const fragmentTitleEmbedding = prepareStringForSql(result._source.fragmentTitleEmbedding);
      const model_id = result._source.model_id;
      const uuid = result._source.uuid;
      const resultType = result._source.resultType;
      const url = result._source.url;
      const fragmentChannel = result._source.fragmentChannel;
      const tags = prepareStringForSql(result._source.tags);
      const query_name = '';
      const result_quality = '';
      const result_quality_subcategory = '';
      const action = '';
      const comments = '';
      const insert_date = timestamp;
      const update_date = timestamp;

      const sql = `
        INSERT INTO fact.IndexDocs (
          index_name,
          fragmentTitleSuggest,
          fragmentTitleSuggestIsTruncated,
          fragmentTitle,
          shortDescriptionEmbedding,
          fragmentTitleEmbedding,
          shortDescription,
          model_id,
          uuid,
          resultType,
          url,
          fragmentChannel,
          tags,
          query_name,
          result_quality,
          result_quality_subcategory,
          action,
          comments,
          insert_date,
          update_date
        ) VALUES (
          '${indexName}',
          '${fragmentTitleSuggest}',
          ${fragmentTitleSuggestIsTruncated},
          '${fragmentTitle}',
          '${shortDescriptionEmbedding}',
          '${fragmentTitleEmbedding}',
          '${shortDescription}',
          '${model_id}',
          '${uuid}',
          '${resultType}',
          '${url}',
          '${fragmentChannel}',
          '${tags}',
          '${query_name}',
          '${result_quality}',
          '${result_quality_subcategory}',
          '${action}',
          '${comments}',
          '${insert_date}',
          '${update_date}'
        )
      `;
      await sqlNonQuery(sql);
      return res.json(results);
    }
    res.json(results);
  });
  
  
  module.exports = router;
  
  