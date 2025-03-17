select * from SearchQueryTestSet;
select * from AutomatedTestResults  where search_id = 'tc001';
select *  from  ManualReviews;
select * from tst.AutomatedTestResults;
select * from src.Faqs where question like '%bsb%';-- 'What is my account number and BSB?'
select * from tst.SearchQueryTestSet where result_1_title like '%difficulty%';-- 'What is my account number and BSB?'
select * from tst.SearchQueryTestSet where expected_results = 'What is my account number and BSB?'
select * from tst.ManualReviews;
select * from src.DummyIndex;
select * from src.ExpectedResults order by search_id;-- where search_id = 'TC042'
select expected_results from tst.SearchQueryTestSet;

select * 
from src.DummyIndex 
where fragmenttitle in (select expected_results from tst.SearchQueryTestSet);

select distinct * from (
select t1.fragmentTitle, t2.expected_results from src.DummyIndex t1
full outer join tst.SearchQueryTestSet t2 on t1.fragmentTitle like '%' + t2.expected_results + '%'
) t3


select distinct * from (
select t1.fragmentTitle, t2.expected_results from src.DummyIndex t1
full outer join tst.SearchQueryTestSet t2 on t2.expected_results like '%' + t1.fragmentTitle  + '%'
) t3
where fragmentTitle is null
or expected_results is null;

SELECT 
distinct id, search_id,  search_term, expected_results, result_quality, assessed 
FROM tst.SearchQueryTestSet 
where result_quality = '0'
and expected_results  in (select fragmentTitle from src.DummyIndex);



select fragmentTitle from src.DummyIndex
where fragmentTitle = 'How do I add a sub-account to an existing account?'

select * from tst.ManualReviews;
create table DummyIndex(
Id int not null primary key identity(1,1),
name varchar(4000)
);

select * into archive.SearchQueryTestResults20250309161800 from SearchQueryTestResults;









