drop table ResultQualityCategories;
go;
create table ResultQualityCategories(
Id int not null primary key,
Result_Quality varchar(50),
Result_Quality_Subcategory varchar(500)
);
go;
insert into ResultQualityCategories values (0,'Bad','Preferred answer not found');
insert into ResultQualityCategories values (1,'Bad','Preferred answer not in index');
insert into ResultQualityCategories values (2,'OK','Preferred answer not present but acceptable alternative is present');
insert into ResultQualityCategories values (3,'Good','Preferred answer is present but not result 1');
insert into ResultQualityCategories values (4,'Good','Preferred answer is present and is result 1 but alternatives are not found');
insert into ResultQualityCategories values (5,'Perfect','Preferred answer is present and is result 1');


select * from ResultQualityCategories;