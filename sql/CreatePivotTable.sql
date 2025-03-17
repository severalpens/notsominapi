
SELECT search_id,
    [1] AS ResultPos1,
    [2] AS ResultPos2,
    [3] AS ResultPos3
FROM
(
    SELECT result_quality_score,
    result_pos, search_id
    FROM fact.TestResults
) p
PIVOT
(
    MAX (result_quality_score)
    FOR result_pos IN ([1],[2],[3])
) AS pvt
ORDER BY pvt.search_id;