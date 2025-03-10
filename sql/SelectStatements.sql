select * from SearchQueryTestSet;
select * from AutomatedTestResults  where search_id = 'tc001';
select *  from  ManualReviews;

create table DummyIndex(
Id int not null primary key identity(1,1),
name varchar(4000)
);


alter schema dbo
transfer tst.DummyIndex;


select * into archive.SearchQueryTestResults20250309161800 from SearchQueryTestResults;

truncate table SearchQueryTestResults;

drop table ManualReviews;

create table ManualReviews(
Id int not null primary key identity(1,1),
insert_date varchar(4000),
update_date varchar(4000),
testset_date varchar(4000),
search_term varchar(4000),
result_1_title varchar(4000),
result_2_title varchar(4000),
result_3_title varchar(4000),
automated_result varchar(4000),
manual_result varchar(4000),
is_interesting varchar(4000),
comments varchar(4000),
reference varchar(400)
);

insert into assessments values ('atm withdrawal limit','2025-03-07T00:28:18.463Z','2025-03-07T00:28:18.463Z','2025-03-07T00:28:18.463Z','atm withdrawal limit','','Bad - preferred answer not present','none of the above','no_relevant_document_exists','','Expected result ''Change your daily cash withdrawal limit'' doesn''t exist','')

insert into assessments
select '2025-03-06T08:20:09.009Z', '2025-03-06T08:20:09.009Z', '2025-03-06T08:20:09.009Z', search_term, result_quality, manual_result_quality, preferred_answer_position, failure_reason,'', comments, reference from ass2;



select * from ass










