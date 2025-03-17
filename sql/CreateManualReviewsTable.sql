

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