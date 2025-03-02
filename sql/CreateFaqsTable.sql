
create table faqs(
FaqId int not null primary key identity(1,1),
Question varchar(500),
Answer varchar(4000)
);

select * from faqs;