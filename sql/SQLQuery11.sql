with t1 as (
select distinct search_term, expected_result from randomquestions) 

select * from assessments a
join t1 on a.search_term = t1.search_term