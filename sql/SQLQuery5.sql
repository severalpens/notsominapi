select 
search_term, expected_results, result_1_title, result_2_title, result_3_title
from tst.SearchQueryTestSet t1
where t1.expected_result_exists = '0'
and t1.result_quality = '0'

select * from src.DummyIndex