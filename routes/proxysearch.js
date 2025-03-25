
require('dotenv').config();
var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var path = require('path');

const  EsContext = require('../utils/EsContext');

const esContext = new EsContext();

function parseJSON(data) {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (error) {
    }
  }

  if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        data[key] = parseJSON(data[key]);
      }
    }
  }

  return data;
}



router.post('/', async function (req, res, next) {
  if (await esContext.verifyClientConnection()) {
    //recursively parse req.body
    const reqBody = parseJSON(req.body);
    console.log('reqBody', reqBody);
    const result = await esContext.client.search({
      index: 'dummy_index',
      body: reqBody
    });
    res.send(result);
  }
  else {
    res.send('Failed to connect to ElasticSearch');
  }
});



  module.exports = router;
  
  