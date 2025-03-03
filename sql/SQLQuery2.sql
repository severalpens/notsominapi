drop table TestResults;
create table TestResults(
Id int not null primary key identity(1,1),
QuestionId varchar(4000),
Question varchar(4000),
faqShortAnswer varchar(4000),
shortDescription varchar(4000),
fragmentTitle varchar(4000)
);

select * from dummy_index_data_sample where title like'%overseas&'

SELECT 
    t1.id, 
    t1.questionid, 
    REPLACE(REPLACE(t1.Question, CHAR(13), ''), CHAR(10), '') AS Question,
    REPLACE(REPLACE(t1.shortDescription, CHAR(13), ''), CHAR(10), '') AS shortDescription,
    REPLACE(REPLACE(t1.faqShortAnswer, CHAR(13), ''), CHAR(10), '') AS faqShortAnswer,
    '',
    REPLACE(REPLACE(t2.Channel_app_website, CHAR(13), ''), CHAR(10), '') AS Channel_app_website,
    REPLACE(REPLACE(t2.Search_Result_Type, CHAR(13), ''), CHAR(10), '') AS Search_Result_Type,
    REPLACE(REPLACE(t2.Short_Meta_Description, CHAR(13), ''), CHAR(10), '') AS Short_Meta_Description,
    REPLACE(REPLACE(t2.Tag, CHAR(13), ''), CHAR(10), '') AS Tag,
    REPLACE(REPLACE(t2.Tag2, CHAR(13), ''), CHAR(10), '') AS Tag2,
    REPLACE(REPLACE(t2.Tag3, CHAR(13), ''), CHAR(10), '') AS Tag3,
    REPLACE(REPLACE(t2.Tag4, CHAR(13), ''), CHAR(10), '') AS Tag4,
    REPLACE(REPLACE(t2.Tag5, CHAR(13), ''), CHAR(10), '') AS Tag5,
    REPLACE(REPLACE(t2.Title, CHAR(13), ''), CHAR(10), '') AS Title,
    REPLACE(REPLACE(t2.URL_Reference_Deep_Link, CHAR(13), ''), CHAR(10), '') AS URL_Reference_Deep_Link
FROM testresults t1 
JOIN dummy_index_data_sample t2 ON t1.fragmentTitle = t2.Title
ORDER BY id, questionid;


select * from dummy_index_data_sample where title = 'Close an account'
select * from testresults where question like '%Close an account%'