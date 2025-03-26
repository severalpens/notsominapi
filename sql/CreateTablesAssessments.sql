create table app.assessments(
Id int not null primary key identity(1,1),
search_id varchar(50),
query_name varchar(50),
search_term varchar(4000),
author_name varchar(500),
comments varchar(4000),
timestamp datetime
);

create table app.revisedOrder(
Id int not null primary key identity(1,1),
search_id varchar(50),
query_name varchar(50),
search_term varchar(4000),
author_name varchar(500),
pos int,
fragmentTitle varchar(4000),
timestamp datetime);

select * from  app.assessments;
select * from  app.revisedOrder;

