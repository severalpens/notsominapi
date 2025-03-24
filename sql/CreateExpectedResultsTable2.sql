drop table dim.ExpectedResults
GO

create table dim.ExpectedResults(
Id int not null primary key identity(1,1),
search_id varchar(50),
search_term varchar(4000),
expected_result_type varchar(500),
expected_result varchar(4000),
expected_result_pos int,
expected_es_score varchar(500),
expected_quality_score int
)
GO

insert into dim.ExpectedResults
select distinct 
ID,
searchTerm,
'Task',
ExpectedResultsTask,
1,
'',
null
from src.Top100SearchTermsV1
GO


insert into dim.ExpectedResults
select ID search_id,'', 'FAQ', ExpectedResults1 expected_result, 1 expected_result_pos,'' expected_es_score,null expected_quality_score from src.Top100SearchTermsV1ExpectedResults where ExpectedResults1 is not null
union
select ID search_id,'', 'FAQ', ExpectedResults2 expected_result, 2,'',null from src.Top100SearchTermsV1ExpectedResults where ExpectedResults2 is not null
union
select ID search_id,'', 'FAQ', ExpectedResults3 expected_result, 3,'',null from src.Top100SearchTermsV1ExpectedResults where ExpectedResults3 is not null
union
select ID search_id,'', 'FAQ', ExpectedResults4 expected_result, 4,'',null from src.Top100SearchTermsV1ExpectedResults  where ExpectedResults4 is not null
union
select distinct ID search_id,'', 'AdditionalFAQ',AdditionalFAQ expected_result,5,'',null from src.Top100SearchTermsV1 where AdditionalFAQ is not null
GO

update  t1
set t1.search_term = t2.searchterm
from dim.ExpectedResults t1
join src.Top100SearchTermsV1 t2 on t1.search_id = t2.ID
WHERE t1.search_term = '' or t1.search_term is null
GO

select * from dim.ExpectedResults

