require('dotenv').config();
var path = require('path');
var fs = require('fs-extra');

const buildQuery = ( queryName, searchTerm, boostingValues) => {
    const queryTemplates = {
        "baseline": {
          "description": "Keyword search on fragmentTitle, shortDescription, faqShortAnswer\nNo boosting",
          "query": {
            "multi_match": {
              "query": searchTerm,
              "fields": ["fragmentTitle", "shortDescription", "faqShortAnswer"]
            }
          }
        },
        "boosting": {
          "description": "Semantic matching on fragmentTitle, shortDescription, faqShortAnswer\nPlus lexical matching on fragmentTitle, shortDescription, faqShortAnswer, using synonyms for better matching and boosting these results\nSelf Service Task results appear higher in rankings, but only if they are already relevant",
          "query": {
            "function_score": {
              "query": {
                "bool": {
                  "should": [
                    {
                      "sparse_vector": {
                        "query": searchTerm,
                        "field": "fragmentTitleEmbedding",
                        "inference_id": ".elser_model_2",
                        "boost": boostingValues[0]
                      }
                    },
                    {
                      "sparse_vector": {
                        "query": searchTerm,
                        "field": "faqShortAnswerEmbedding",
                        "inference_id": ".elser_model_2",
                        "boost": boostingValues[1]
                      }
                    },
                    {
                      "sparse_vector": {
                        "query": searchTerm,
                        "field": "shortDescriptionEmbedding",
                        "inference_id": ".elser_model_2",
                        "boost": boostingValues[2]
                      }
                    },
                    {
                      "multi_match": {
                        "query": searchTerm,
                        "fields": ["fragmentTitle", "shortDescription", "faqShortAnswer"],
                        "analyzer": "synonyms_search",
                        "boost": boostingValues[3]
                      }
                    }
                  ]
                }
              },
              "functions": [
                {
                  "filter": { "term": { "resultType": "Self Service Task" } },
                  "weight": boostingValues[4]
                }
              ],
              "boost_mode": "multiply"
            }
          }
        }
      }

return queryTemplates[queryName].query;
}

module.exports = buildQuery;
      