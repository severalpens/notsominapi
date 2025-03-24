require('dotenv').config();
var path = require('path');
var fs = require('fs-extra');

const buildQuery = ( queryName, searchTerm) => {
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
        "semantic": {
          "description": "Semantic search on fragmentTitle, shortDescription, faqShortAnswer\nPlus keyword search on fragmentTitle, shortDescription, faqShortAnswer\nNo boosting",
          "query": {
            "bool": {
              "should": [
                {
                  "sparse_vector": {
                    "query": searchTerm,
                    "field": "fragmentTitleEmbedding",
                    "inference_id": ".elser_model_2",
                    "boost": 1
                  }
                },
                {
                  "sparse_vector": {
                    "query": searchTerm,
                    "field": "faqShortAnswerEmbedding",
                    "inference_id": ".elser_model_2",
                    "boost": 1
                  }
                },
                {
                  "sparse_vector": {
                    "query": searchTerm,
                    "field": "shortDescriptionEmbedding",
                    "inference_id": ".elser_model_2",
                    "boost": 1
                  }
                },
                {
                  "multi_match": {
                    "query": searchTerm,
                    "fields": ["fragmentTitle", "shortDescription", "faqShortAnswer"],
                    "boost": 4
                  }
                }
              ]
            }
          }
        },
        "semantic_synonym": {
          "description": "Semantic search on fragmentTitle, shortDescription, faqShortAnswer\nPlus keyword search on fragmentTitle, shortDescription, faqShortAnswer\nPlus synonyms for keyword search\nNo boosting",
          "query": {
            "bool": {
              "should": [
                {
                  "sparse_vector": {
                    "query": searchTerm,
                    "field": "fragmentTitleEmbedding",
                    "inference_id": ".elser_model_2",
                    "boost": 1
                  }
                },
                {
                  "sparse_vector": {
                    "query": searchTerm,
                    "field": "faqShortAnswerEmbedding",
                    "inference_id": ".elser_model_2",
                    "boost": 1
                  }
                },
                {
                  "sparse_vector": {
                    "query": searchTerm,
                    "field": "shortDescriptionEmbedding",
                    "inference_id": ".elser_model_2",
                    "boost": 1
                  }
                },
                {
                  "multi_match": {
                    "query": searchTerm,
                    "fields": ["fragmentTitle", "shortDescription", "faqShortAnswer"],
                    "analyzer": "synonyms_search",
                    "boost": 4
                  }
                }
              ]
            }
          }
        }
        ,"synonym":{
          "description": "Keyword search on fragmentTitle, shortDescription, faqShortAnswer\nPlus synonyms for keyword search\nNo boosting",
          "query": {
            "bool": {
              "should": [
                {
                  "sparse_vector": {
                    "query": searchTerm,
                    "field": "fragmentTitleEmbedding",
                    "inference_id": ".elser_model_2",
                    "boost": 1
                  }
                },
                {
                  "sparse_vector": {
                    "query": searchTerm,
                    "field": "faqShortAnswerEmbedding",
                    "inference_id": ".elser_model_2",
                    "boost": 1
                  }
                },
                {
                  "sparse_vector": {
                    "query": searchTerm,
                    "field": "shortDescriptionEmbedding",
                    "inference_id": ".elser_model_2",
                    "boost": 1
                  }
                },
                {
                  "multi_match": {
                    "query": searchTerm,
                    "fields": ["fragmentTitle", "shortDescription", "faqShortAnswer"],
                    "analyzer": "synonyms_search",
                    "boost": 4
                  }
                }
              ]
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
                        "boost": 1
                      }
                    },
                    {
                      "sparse_vector": {
                        "query": searchTerm,
                        "field": "faqShortAnswerEmbedding",
                        "inference_id": ".elser_model_2",
                        "boost": 1
                      }
                    },
                    {
                      "sparse_vector": {
                        "query": searchTerm,
                        "field": "shortDescriptionEmbedding",
                        "inference_id": ".elser_model_2",
                        "boost": 1
                      }
                    },
                    {
                      "multi_match": {
                        "query": searchTerm,
                        "fields": ["fragmentTitle", "shortDescription", "faqShortAnswer"],
                        "analyzer": "synonyms_search",
                        "boost": 2.5
                      }
                    }
                  ]
                }
              },
              "functions": [
                {
                  "filter": { "term": { "resultType": "Self Service Task" } },
                  "weight": 2
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
      