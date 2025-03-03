drop table TestQuestions

create table TestQuestions(
Id int not null primary key identity(1,1),
Question varchar(4000),
QuestionSource varchar(4000)
);

insert into TestQuestions select distinct Question, 'faqs' from faqs;
insert into TestQuestions select distinct Title, 'dummy_index_data_sample' from dummy_index_data_sample where Title not in (select distinct question from testquestions);

select * from testQuestions;