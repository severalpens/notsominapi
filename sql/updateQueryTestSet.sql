WITH LatestResults AS (
    SELECT 
        MAX(insert_date) AS max_insert_date
    FROM 
        SearchQueryTestResults
),

PivotedResults AS (
    SELECT 
        search_id,
        MAX(CASE WHEN result_id = '1' THEN title END) AS result_1_title,
        MAX(CASE WHEN result_id = '1' THEN type END) AS result_1_type,
        MAX(CASE WHEN result_id = '1' THEN description END) AS result_1_short_description,
        MAX(CASE WHEN result_id = '1' THEN is_match END) AS result_1_is_match,
        MAX(CASE WHEN result_id = '1' THEN answer END) AS result_1_faq_short_answer,
        MAX(CASE WHEN result_id = '1' THEN score END) AS result_1_es_score,
        
        MAX(CASE WHEN result_id = '2' THEN title END) AS result_2_title,
        MAX(CASE WHEN result_id = '2' THEN type END) AS result_2_type,
        MAX(CASE WHEN result_id = '2' THEN description END) AS result_2_short_description,
		MAX(CASE WHEN result_id = '2' THEN is_match END) AS result_2_is_match,

        MAX(CASE WHEN result_id = '2' THEN answer END) AS result_2_faq_short_answer,
        MAX(CASE WHEN result_id = '2' THEN score END) AS result_2_es_score,
        
        MAX(CASE WHEN result_id = '3' THEN title END) AS result_3_title,
        MAX(CASE WHEN result_id = '3' THEN type END) AS result_3_type,
        MAX(CASE WHEN result_id = '3' THEN description END) AS result_3_short_description,
		MAX(CASE WHEN result_id = '3' THEN is_match END) AS result_3_is_match,
        MAX(CASE WHEN result_id = '3' THEN answer END) AS result_3_faq_short_answer,
        MAX(CASE WHEN result_id = '3' THEN score END) AS result_3_es_score,
        
        MAX(search_term) AS search_term,
        MAX(expected_results) AS expected_results,
        MAX(is_match) AS is_match,
        MAX(insert_date) AS insert_date
    FROM 
        SearchQueryTestResults sqtr
		where insert_date = (select max(insert_date) from SearchQueryTestResults)
		group by search_id
)

UPDATE sqts
SET 
    sqts.update_date = pr.insert_date,
    
    sqts.result_1_title = pr.result_1_title,
    sqts.result_1_type = pr.result_1_type,
    sqts.result_1_short_description = pr.result_1_short_description,
    sqts.result_1_faq_short_answer = pr.result_1_faq_short_answer,
    sqts.result_1_es_score = pr.result_1_es_score,
    
    sqts.result_2_title = pr.result_2_title,
    sqts.result_2_type = pr.result_2_type,
    sqts.result_2_short_description = pr.result_2_short_description,

    sqts.result_2_faq_short_answer = pr.result_2_faq_short_answer,
    sqts.result_2_es_score = pr.result_2_es_score,
    
    sqts.result_3_title = pr.result_3_title,
    sqts.result_3_type = pr.result_3_type,
    sqts.result_3_short_description = pr.result_3_short_description,

    sqts.result_3_faq_short_answer = pr.result_3_faq_short_answer,
    sqts.result_3_es_score = pr.result_3_es_score,
    
    sqts.result_quality = CASE 
        WHEN pr.result_3_is_match = 'true' THEN 'Good'
        WHEN pr.result_2_is_match = 'true' THEN 'Good'
        WHEN pr.result_1_is_match = 'true' THEN 'Perfect'
        ELSE 'Bad'
    END,
    sqts.failure_reason = ''
FROM 
    SearchQueryTestSet sqts
INNER JOIN 
    PivotedResults pr ON sqts.search_id = pr.search_id;


	select * from SearchQueryTestSet;