select * from dim.ResultQualityCategories;
select * from dim.ExpectedResults -- where search_id = 'tc033';
select * from dim.TestSet;
select * from dim.QueryNames;
select * from fact.ActualResults
select * from fact.FinalScores;

    SELECT distinct query_name, search_id, search_term, expected_result_pos FROM fact.ExpectedResultsPerQuery 
	order by query_name, search_id,  expected_result_pos 

	
	update t1
    set t1.expected_pos  = t2.expected_result_pos
    from fact.actualresults t1
    join  fact.expectedresultsperquery t2 
    on t1.search_id = t2.search_id
    and t1.query_name = t2.query_name
    where t1.fragmenttitle = t2.expected_result;
select * 
from fact.ExpectedResultsSummary t1
join (select search_id, query_name, count(*) mycount from fact.actualResults group by search_id, query_name) t2
on t1.search_id = t2.search_id and t1.query_name = t2.query_name

update fact.ExpectedResultsPerQuery
set isinactuals = 1 
where actual_pos > 0;

update fact.ExpectedResultsSummary
set ExpectedResultsInActualResultsCount = 



        update t1
set t1.ExpectedResultsInActualResultsCount = t2.mycount
from fact.ExpectedResultsSummary t1
join (select search_id, query_name, count(*) mycount from fact.ExpectedResultsPerQuery where actual_pos > 0 GROUP BY search_id, query_name) t2
on t1.search_id = t2.search_id and t1.query_name = t2.query_name;


select Id ,search_id, index_name, query_name, search_term, result_pos, fragmentTitle,  isPreferredAnswer, run_date from fact.ActualResults order by query_name, search_id, result_pos;
exec update_final_scores
select distinct query_name, search_id from fact.expectedREsultsPerQuery
where expected_result_pos = 1
and isExpectedResultReturned = 1
select * from vwReport1;
select * from fact.TestResults;
select * from fact.AllIndexDocs;
select * from report.TestReport1;
select * from src.Faqs;
select * from src.ManualDeskCheck;
select * from src.Top100SearchTermsV1;
select * from src.Top100SearchTermsV1ExpectedResults;
select * from zzArchive.ExpectedResults2;
select * from zzArchive.SearchQueryTestSet;
    SELECT distinct search_id, search_term, query_name FROM fact.ExpectedResultsPerQuery where search_id not in 
    (select distinct search_id from fact.ExpectedResultsPerQuery where isinindex = 0);

alter view finalscore1 as 
select query_name, result_quality, count(*) Total
from fact.expectedResultsPerQuery t1
join dim.resultqualitycategories t2 on t1.finalscore = t2.id
group by query_name, result_quality;

select * from dim.ResultQualityCategories;;

select * from fact.ExpectedResultsPerQuery;








