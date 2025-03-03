drop table faqs;
create table faqs(
FaqId int not null primary key identity(1,1),
Question varchar(4000),
Answer varchar(4000)
);

