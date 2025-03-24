update dim.expectedResults set combined_erp = 0;

update dim.expectedResults
set combined_erp =  1
where search_id in (select distinct search_id from dim.expectedresults where expected_result_type = 'Task') ;

update dim.expectedresults
set combined_erp = expected_result_pos + 1 
where expected_result_type = 'FAQ'
and search_id in (select distinct search_id from dim.expectedresults where expected_result_type = 'Task') ;

update dim.expectedresults
set combined_erp = expected_result_pos
where expected_result_type = 'FAQ'
and search_id not in (select distinct search_id from dim.expectedresults where expected_result_type = 'Task') ;



;with q1 as
(
select search_id, max(combined_erp) + 1 max_erp 
from dim.ExpectedResults
group by search_id
)

update t1
set t1.combined_erp = q1.max_erp
from dim.ExpectedResults t1
join q1 on t1.search_id = q1.search_id
where t1.expected_result_type = 'AdditionalFAQ';

select * from dim.expectedResults order by search_id, id
