

create table src.ExpectedResults(
Id int not null primary key identity(1,1), 
search_id varchar(400),
fragmentTitle varchar(4000)
);

select distinct string_split(expected_results,',') from tst.SearchQueryTestSet;

truncate table src.expectedresults;


-- create the CTE
WITH cte_split(search_id, split_values, csv) AS
(
	-- anchor member
    SELECT
        search_id,
        LEFT(expected_results, CHARINDEX(',', expected_results + ',') - 1),
        STUFF(expected_results, 1, CHARINDEX(',', expected_results + ','), '')
    FROM tst.SearchQueryTestSet

    UNION ALL

	-- recursive member
    SELECT
        search_id,
        LEFT(csv, CHARINDEX(',', csv + ',') - 1),
        STUFF(csv, 1, CHARINDEX(',', csv + ','), '')
    FROM cte_split
    -- termination condition
    WHERE csv > ''
)
-- use the CTE and generate the final result set
insert into src.ExpectedResults
SELECT search_id, rtrim(ltrim(split_values))
FROM cte_split;

update src.ExpectedResults
set fragmentTitle = fragmentTitle + ', and how do I get one?'
where id = 115;

delete from src.ExpectedResults where id = 116;


update src.ExpectedResults
set fragmentTitle = fragmentTitle + ', and how do I get one?'
where id = 99;

delete from src.ExpectedResults where id = 101;


update src.ExpectedResults
set fragmentTitle = fragmentTitle + ', and how do I get one?'
where id = 42;

delete from src.ExpectedResults where id = 126;


update src.ExpectedResults
set fragmentTitle = fragmentTitle + ', and how do I get one?'
where id = 28;

delete from src.ExpectedResults where id = 130;


update src.ExpectedResults
set fragmentTitle = 'How do I update my name, address and personal details?'
where id = 74;

delete from src.ExpectedResults where id = 108;


update src.ExpectedResults
set fragmentTitle = fragmentTitle + ', which one will it use to make a purchase??'
where id = 89;

delete from src.ExpectedResults where id = 104;




