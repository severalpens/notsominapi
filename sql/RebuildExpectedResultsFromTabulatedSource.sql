with
t1 as (
select distinct ID search_id, search_term,'Task' expected_result_type,  task1 expected_result from book2 where task1 is not null
union
select distinct ID search_id, search_term, 'Task' expected_result_type, task2 expected_result from book2 where task2 is not null
union
select distinct ID search_id, search_term, 'faq' expected_result_type, faq1 expected_result from book2 where faq1 is not null
union
select distinct ID search_id, search_term, 'faq' expected_result_type, faq2 expected_result from book2 where faq2 is not null
union
select distinct ID search_id, search_term, 'faq' expected_result_type, faq3 expected_result from book2 where faq3 is not null
union
select distinct ID search_id, search_term, 'faq' expected_result_type, faq4 expected_result from book2 where faq4 is not null
),
t2 as (
select distinct * , 

ROW_NUMBER() OVER (PARTITION BY search_id ORDER BY expected_result_type DESC) pos
from t1
)
insert into dim.ExpectedResults(search_id, search_term,  expected_result_type, expected_result, pos)
select * from  t2;
      
	  select * from dim.ExpectedResults

