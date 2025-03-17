select * from dim.testset;

drop table dim.testset;

create table dim.TestSet(
Id int not null primary key identity(1,1),
search_id varchar(500),
search_term varchar(4000),
expected_results varchar(4000),
search_type varchar(4000),
test_purpose varchar(4000),
expected_result_quality varchar(4000),
upsert_timestamp datetime);

insert into dim.TestSet
select distinct search_id, search_term, expected_results, search_type, test_purpose, '', getDate() from tst.SearchQueryTestSet;



