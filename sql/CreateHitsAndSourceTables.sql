create table Hits(
HitId int not null primary key identity(1,1),
_id varchar(4000),
_index varchar(4000),
_score varchar(4000)
);


create table Sources(
SourceId int not null primary key identity(1,1),
fragmentTitle varchar(4000),
shortDescription varchar(4000),
uuid varchar(4000),
faqShortAnswer varchar(4000),
HitId int);



ALTER TABLE Sources
ADD CONSTRAINT FK_Sources_Hits
FOREIGN KEY (HitId)
REFERENCES Hits(HitId);



