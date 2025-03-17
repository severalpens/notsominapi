
var express = require('express');
var router = express.Router();

// Proxy search: Client sends the full json body as if it was sending directly to ElasticSearch
app.use('/', async function (req, res, next) {
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



  module.exports = router;
  
  