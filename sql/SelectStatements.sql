WITH q1 AS (
    SELECT  top 100000
	t1.id questionid,
	t2.id testresultid,
        t1.question AS input_query,  
        t1.questionSource, 
        t2.faqShortAnswer, 
        t2.shortDescription, 
        t2.fragmentTitle,
        t2.chatgptscore AS score,
        ROW_NUMBER() OVER (PARTITION BY t1.question ORDER BY t1.id, t2.id asc) AS result_rank
    FROM 
        testquestions t1 
    JOIN 
        testresults t2 
    ON 
        t1.id = t2.QuestionId
		where t2.chatgptscore is not null
		order by t2.id
)
SELECT
    input_query,
    MAX(CASE WHEN result_rank = 1 THEN fragmentTitle END) AS result_1_title,
    -- You can add a type column here if it exists in your data
    MAX(CASE WHEN result_rank = 1 THEN 'FAQ' END) AS result_1_type,
    MAX(CASE WHEN result_rank = 1 THEN shortDescription END) AS result_1_short_description,
    MAX(CASE WHEN result_rank = 1 THEN faqShortAnswer END) AS result_1_faq_short_answer,
    MAX(CASE WHEN result_rank = 1 THEN score END) AS result_1_score,
    
    MAX(CASE WHEN result_rank = 2 THEN fragmentTitle END) AS result_2_title,
    MAX(CASE WHEN result_rank = 2 THEN 'FAQ' END) AS result_2_type,
    MAX(CASE WHEN result_rank = 2 THEN shortDescription END) AS result_2_short_description,
    MAX(CASE WHEN result_rank = 2 THEN faqShortAnswer END) AS result_2_faq_short_answer,
    MAX(CASE WHEN result_rank = 2 THEN score END) AS result_2_score,
    
    MAX(CASE WHEN result_rank = 3 THEN fragmentTitle END) AS result_3_title,
    MAX(CASE WHEN result_rank = 3 THEN 'FAQ' END) AS result_3_type,
    MAX(CASE WHEN result_rank = 3 THEN shortDescription END) AS result_3_short_description,
    MAX(CASE WHEN result_rank = 3 THEN faqShortAnswer END) AS result_3_faq_short_answer,
    MAX(CASE WHEN result_rank = 3 THEN score END) AS result_3_score
FROM 
    q1
GROUP BY 
    input_query
