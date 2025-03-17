select 
'Good',
count(*) mycount 
from tst.SearchQueryTestSet t1
where t1.result_quality = '2' or t1.result_quality = '1'
union
select 
'Perfect',
count(*) mycount 
from tst.SearchQueryTestSet t1
where t1.result_quality = '3'
union
select 
'preferred answer not found',
count(*) mycount 
from tst.SearchQueryTestSet t1
where t1.expected_result_exists = '1'
and t1.result_quality = '0'
union
select 
'preferred answer not in index',
count(*) mycount 
from tst.SearchQueryTestSet t1
where t1.expected_result_exists = '0'
and t1.result_quality = '0';

select search_id, search_term, expected_results, result_quality, expected_result_exists from tst.SearchQueryTestSet where search_id = 'TC016'