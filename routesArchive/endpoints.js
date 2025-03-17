var express = require('express');
var router = express.Router();

// Define a simple route for demonstration
router.get('/', function(req, res, next) {
  res.render('endpoints', { title: 'Express' });
});

module.exports = router;
