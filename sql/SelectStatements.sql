--select 'select * from ' + TABLE_SCHEMA + '.' + table_name from INFORMATION_SCHEMA.tables order by table_schema, table_name;
declare @search_id varchar(50) = 'TC033'
--select * from app.assessments
--select t1.*, t2.result_pos from app.revisedOrder t1
--join fact.actualresults t2 on t1.search_id = t2.search_id and t1.fragmentTitle = t2.fragmentTitle
--order by t1.search_id, t1.pos;

--select * from fact.comments where search_id = @search_id;
--select * from app.revisedOrder where search_id = @search_id;
--select * from dim.TestSet where search_id = @search_id;
select * from dim.ExpectedResults where search_id = @search_id;
--select * from fact.ActualResults where search_id = @search_id;
--select * from fact.AllIndexDocs where fragmenttitle like '%What is a Security Token Code and how do I get one%' --where search_id = @search_id;
select * from fact.ExpectedResultsPerQuery where search_id = @search_id;
select * from fact.ExpectedResultsSummary where search_id = @search_id;

select fragmentTitle, count(*) from fact.ActualResults where query_name = 'boosting_1_1_1_15_15' and search_id = 'TC033' group by fragmentTitle

SELECt fragmentTitle, count(*) FROM FACT.AllIndexDocs group by fragmentTitle











