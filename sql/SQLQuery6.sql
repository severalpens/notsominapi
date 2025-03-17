select 
t1.expected_results, 
t2.fragmentTitle
from tst.SearchQueryTestSet t1
join src.DummyIndex t2 on t2.fragmentTitle like '%' + t1.expected_results + '%'
and t1.result_quality = '0';

select * from tst.SearchQueryTestSet t1
where expected_results like '%,%'
and result_quality = '0'

select * from src.DummyIndex where fragmentTitle like '%PayID%' or fragmentTitle like '%fast payment%'


select 
t1.expected_results, 
t2.fragmentTitle
from tst.SearchQueryTestSet t1
join src.DummyIndex t2 on t1.expected_results like '%' + t2.fragmentTitle + '%'
and t1.result_quality = '0';


select distinct
t1.expected_results, 
t2.fragmentTitle
from tst.SearchQueryTestSet t1
join src.ExpectedResults t2 on t2.fragmentTitle like '%' + t1.expected_results + '%'
and t1.result_quality = '0';


select distinct
t1.expected_results, 
t2.fragmentTitle
from tst.SearchQueryTestSet t1
join src.ExpectedResults t2 on t1.expected_results like '%' + t2.fragmentTitle + '%'
and t1.result_quality = '0';




