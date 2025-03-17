select * from dim.ResultQualityCategories;
select * from dim.TestSet;
select * from fact.allIndexDocs;
select * from fact.TestResults;
select * from source;

select 
t1.*,
t2.Action,
t2.Refined_Ground_Truth,
t2.Questions,
t2.Comments
from report.testreport1 t1
join report.ManualDeskCheck t2 on t1.search_id = t2.search_id
order by search_id,id;

select 
t1.expected_results, 
t2.fragmentTitle
from report.TestReport1 t1
full outer join fact.AllIndexDocs t2 on t1.expected_results like '%' + t2.fragmentTitle + '%';


select * from tst.AutomatedTestResults;
select * from src.Faqs where question like '%bsb%';-- 'What is my account number and BSB?'
select * from tst.SearchQueryTestSet where result_1_title like '%difficulty%';-- 'What is my account number and BSB?'
select * from tst.SearchQueryTestSet where expected_results = 'What is my account number and BSB?'
select * from tst.ManualReviews;

select * from tst.ManualReviews;
create table DummyIndex(
Id int not null primary key identity(1,1),
name varchar(4000)
);










