with b1 as (
select distinct expected_results from (
select t1.fragmentTitle, t2.expected_results from src.DummyIndex t1
full outer join tst.SearchQueryTestSet t2 on t1.fragmentTitle  like '%' + t2.expected_results  + '%'
) t3
where fragmentTitle is null)
select * from b1

update t1
set t1.expected_result_exists = 1
from tst.SearchQueryTestSet t1
where t1.expected_results not in (select expected_results from b1)
--or expected_results is null;

select * from tst.SearchQueryTestSet;