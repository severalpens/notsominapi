var express = require('express');
var router = express.Router();
const  EsContext = require('../utils/EsContext');
const esContext = new EsContext();
const { sqlQuery, sqlNonQuery } = require('../utils/sqldb');
const { prepareStringForSql,  getTimestamp,  getTimestampSuffix } = require('../utils/helpers');

const checkIfExpectedResultIsInIndex = (allIndexDocs,expected_results) => {
  for (const indexDoc of allIndexDocs) {
    if (expected_results.includes(indexDoc.fragmentTitle)) {
      return true;
    }
  }
  return false;
}

function getQueryBody(query_name, search_term) {
const query_bodies = {
  query1:   {
    "multi_match": {
      "query": search_term,
      "fields": ["fragmentTitle", "shortDescription", "faqShortAnswer"]
    }
  },
  query2:           {
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

}
return query_bodies[query_name];
}

const queries = ["query1", "query2"];


const resultQualityCategories = [
  {ResultQuality: 'Bad', ResultQualitySubCategory: 'Preferred Answer not found'},
  {ResultQuality: 'Bad', ResultQualitySubCategory: 'Preferred answer not in index'},
  {ResultQuality: 'OK', ResultQualitySubCategory: 'Preferred answer not present but acceptable alternative is present'},
  {ResultQuality: 'Good', ResultQualitySubCategory: 'Preferred answer is present but not result 1'},
  {ResultQuality: 'Good', ResultQualitySubCategory: 'Preferred answer is present and is result 1 but alternatives are not found'},
  {ResultQuality: 'Perfect', ResultQualitySubCategory: 'Preferred answer is present and is result 1'},
]
  
  router.get('/', async function (req, res) {
    const index_name = 'dummy_index';
    const timestamp = getTimestamp();
    
    // await sqlNonQuery(`select * into zzarchive.TestResultsBK${getTimestampSuffix()} from fact.TestResults;`);
    await sqlNonQuery(`truncate table fact.TestResults;`);
    
    // await sqlNonQuery(`select * into zzarchive.TestReport1BK${getTimestampSuffix()} from report.TestReport1;`);
    await sqlNonQuery(`truncate table report.TestReport1;`);
    
    const allIndexDocs = await sqlQuery(`SELECT distinct fragmentTitle FROM fact.AllIndexDocs where index_name = '${index_name}';`);
    
    const searchQueryTestSet = await sqlQuery('SELECT * FROM dim.TestSet;');

    for (const q of queries) {
      let query_name = q;
      console.log(`Running tests for query: ${query_name}`);
      
      for (const searchQueryTest of searchQueryTestSet) {
        const { search_id, search_term, expected_results } = searchQueryTest;
        let query_body = getQueryBody(query_name, search_term);
      const addToTestReport1 = `INSERT INTO report.TestReport1
                    (search_id
                    ,search_term
                    ,expected_results
                    ,search_type
                    ,test_purpose
                    ,query_name
                    ,run_date)
              select search_id, search_term, expected_results, search_type, test_purpose, '${query_name}','${timestamp}' from dim.TestSet where search_id = '${search_id}';
          `;    
    
      await sqlNonQuery(addToTestReport1);


      const result = await esContext.client.search({
        index: index_name,
        body: {
        query: query_body,
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
  
      let result_pos = 0;
      let resultQualityScore = -1;
  
      for (const hit of result.hits.hits) {
        result_pos++;
        const numberOfHits = result.hits.hits.length;
        const { _source, _score } = hit;
        const title = _source.fragmentTitle ? _source.fragmentTitle : '';
        const isMatch = expected_results.includes(title);
        const noMatchSoFar = resultQualityScore === -1;
        const lastHit = result_pos === numberOfHits;

        if (isMatch && result_pos === 1 && numberOfHits > 1) {
          resultQualityScore = 5;
        }
        if (isMatch && result_pos === 1 && numberOfHits == 1) {
          resultQualityScore = 4;
        }
        if (isMatch && result_pos >= 2 && noMatchSoFar) {
          resultQualityScore = 3;
        }
        
        if (!isMatch && lastHit && noMatchSoFar) {
          if(checkIfExpectedResultIsInIndex(allIndexDocs,expected_results)){
            resultQualityScore = 0;
          } else {
            resultQualityScore = 1;
          }

        }
        const search_term_dto = prepareStringForSql(search_term);
        const fragmentTitle = prepareStringForSql(_source.fragmentTitle);
        const shortDescription = prepareStringForSql(_source.shortDescription);
        const expected_results_dto = prepareStringForSql(expected_results);
        const faqShortAnswer = prepareStringForSql(_source.faqShortAnswer);
        const fragmentTitleSuggest = prepareStringForSql(_source.fragmentTitleSuggest);
        const fragmentTitleSuggestIsTruncated = _source.fragmentTitleSuggestIsTruncated ? 1 : 0;
        const shortDescriptionEmbedding = prepareStringForSql(_source.shortDescriptionEmbedding);
        const fragmentTitleEmbedding = prepareStringForSql(_source.fragmentTitleEmbedding);
        const model_id = _source.model_id;
        const uuid = _source.uuid;
        const resultType = _source.resultType;
        const url = _source.url;
        const fragmentChannel = _source.fragmentChannel;
        const tags = prepareStringForSql(_source.tags);
        const result_quality_score = resultQualityScore;
        const result_quality_category = resultQualityCategories[resultQualityScore]?.ResultQuality;
        const result_quality_subcategory = resultQualityCategories[resultQualityScore]?.ResultQualitySubCategory;
        const action = '';
        const comments = '';
        const insert_date = timestamp;
        const update_date = timestamp;
  
        const addTestResultSql = `

INSERT INTO fact.TestResults
           (search_id
           ,search_term
           ,result_pos
           ,index_name
           ,expected_results
           ,fragmentTitleSuggest
           ,fragmentTitleSuggestIsTruncated
           ,fragmentTitle
           ,shortDescriptionEmbedding
           ,fragmentTitleEmbedding
           ,shortDescription
           ,model_id
           ,uuid
           ,resultType
           ,url
           ,fragmentChannel
           ,tags
           ,query_name
           ,result_quality_score
           ,result_quality
           ,result_quality_subcategory
           ,action
           ,comments
           ,insert_date
           ,update_date)
     VALUES
           ('${search_id}'
           ,'${search_term_dto}'
           ,${result_pos}
           ,'${index_name}'
           ,'${expected_results_dto}'
           ,'${fragmentTitleSuggest}'
           ,${fragmentTitleSuggestIsTruncated}
           ,'${fragmentTitle}'
           ,'${shortDescriptionEmbedding}'
           ,'${fragmentTitleEmbedding}'
           ,'${shortDescription}'
           ,'${model_id}'
           ,'${uuid}'
           ,'${resultType}'
           ,'${url}'
           ,'${fragmentChannel}'
           ,'${tags}'
           ,'${query_name}'
           ,'${result_quality_score}'
           ,'${result_quality_category}'
           ,'${result_quality_subcategory}'
           ,'${action}'
           ,'${comments}'
           ,'${insert_date}'
           ,'${update_date}')
            `;
  
        await sqlNonQuery(addTestResultSql);
        await sqlNonQuery(`UPDATE report.TestReport1 SET result_quality_score = '${resultQualityScore}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
        await sqlNonQuery(`UPDATE report.TestReport1 SET result_quality = '${resultQualityCategories[resultQualityScore]?.ResultQuality}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
        await sqlNonQuery(`UPDATE report.TestReport1 SET result_quality_subcategory = '${resultQualityCategories[resultQualityScore]?.ResultQualitySubCategory}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
        await sqlNonQuery(`UPDATE report.TestReport1 SET query_name = '${query_name}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
        switch (result_pos) {
          case 1:
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_1_title = '${fragmentTitle}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_1_type = '${resultType}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_1_short_description = '${shortDescription}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_1_faq_short_answer = '${faqShortAnswer}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_1_es_score = '${_score}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            break
          case 2:
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_2_title = '${fragmentTitle}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_2_type = '${resultType}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_2_short_description = '${shortDescription}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_2_faq_short_answer = '${faqShortAnswer}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_2_es_score = '${_score}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            
            break;
          case 3:
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_3_title = '${fragmentTitle}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_3_type = '${resultType}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_3_short_description = '${shortDescription}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_3_faq_short_answer = '${faqShortAnswer}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            await sqlNonQuery(`UPDATE report.TestReport1 SET result_3_es_score = '${_score}' WHERE search_id = '${search_id}' AND run_date = '${timestamp}' AND query_name = '${query_name}';`);
            
            break;
          default:
            break;
        }
  
      }
    }
  }
    return res.json({ message: 'Tests run successfully' });
  });
  
  
  module.exports = router;
  
  