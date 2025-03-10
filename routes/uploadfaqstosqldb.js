var express = require('express');
var router = express.Router();
const fs = require('fs-extra');
const { sqlNonQuery } = require('../utils/sqldb');

router.post('/uploadfaqstosqldb', async function (req, res, next) {
  const faqs = await fs.readJson('./faqs.json');
  await sqlNonQuery('TRUNCATE TABLE faqs;');

  for (const faq of faqs) {
    const question = faq.Question.replace(/'/g, "''");
    const answer = faq.Answer.replace(/'/g, "''").slice(0, 4000);
    const sqlQuery = `INSERT INTO faqs (Question, Answer) VALUES ('${question}', '${answer}');`;
    await sqlNonQuery(sqlQuery);
  }
  res.send('FAQs uploaded to SQL DB');
});


module.exports = router;
