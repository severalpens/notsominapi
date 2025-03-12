
select 
  search_id,
  search_term,
  expected_results,
  result_1_title,
  REPLACE(REPLACE(result_1_faq_short_answer, CHAR(13), ''), CHAR(10), '') as result_1_faq_short_answer,
  REPLACE(REPLACE(result_1_short_description, CHAR(13), ''), CHAR(10), '') as result_1_short_description,
  result_2_title,
  REPLACE(REPLACE(result_2_faq_short_answer, CHAR(13), ''), CHAR(10), '') as result_2_faq_short_answer,
  REPLACE(REPLACE(result_2_short_description, CHAR(13), ''), CHAR(10), '') as result_2_short_description,
  result_3_title,
  REPLACE(REPLACE(result_3_faq_short_answer, CHAR(13), ''), CHAR(10), '') as result_3_faq_short_answer,
  REPLACE(REPLACE(result_3_short_description, CHAR(13), ''), CHAR(10), '') as result_3_short_description,
  CASE result_quality
    WHEN '0' THEN 'Bad - preferred answer not present'
    WHEN '1' THEN 'OK - preferred answer not present but acceptable alternative is present'
    WHEN '2' THEN 'Good - preferred answer is present but not result 1'
    WHEN '3' THEN 'Perfect - preferred answer is present and is result 1'
  END AS result_quality
from tst.SearchQueryTestSet
