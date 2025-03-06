select * from SearchQueryTestSet;
select * from SearchQueryTestResults 
select * from assessments

update t1
set t1.is_match = max(t2.ismatch)

select t1.search_id, t1.result_quality, max(t2.is_match)
from SearchQueryTestSet t1
join SearchQueryTestResults t2 on t1.search_id = t2.search_id
group by t1.search_id, t1.result_quality

INSERT INTO SearchQueryTestResults
VALUES ('TC003','3', '2025-03-06T01:02:12.920Z', 'travel overseas notification', 'Alert us that you are travelling, Do I need to notify Suncorp Bank when I'm going overseas?','good', 'Do I need to notify Suncorp Bank when I`m going overseas?', 'FAQ', 'Information about notifying Suncorp Bank of international travel.', 'We recommend letting us know when you are travelling internationally. This helps our fraud monitoring team recognise your overseas transactions as legitimate, reducing the chance of your card being temporarily blocked for suspicious activity. You can notify us directly in the Suncorp App by tapping `More`, then `Self service`, `Profile` and selecting `Alert us that you are travelling`. Alternatively, you can call us on 13 11 55. Remember to also ensure your contact details are up to date so we can reach you while you`re away if needed.', '3.5317419');
