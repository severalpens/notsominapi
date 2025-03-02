ALTER TABLE [dbo].[Indices] DROP CONSTRAINT [FK_Indices_Clusters]
GO
ALTER TABLE [dbo].[ApiKeys] DROP CONSTRAINT [FK_ApiKeys_Clusters]
GO
/****** Object:  Table [dbo].[RnaQuestions]    Script Date: 1/03/2025 11:05:53 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RnaQuestions]') AND type in (N'U'))
DROP TABLE [dbo].[RnaQuestions]
GO
/****** Object:  Table [dbo].[RnaAnswers]    Script Date: 1/03/2025 11:05:53 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RnaAnswers]') AND type in (N'U'))
DROP TABLE [dbo].[RnaAnswers]
GO
/****** Object:  Table [dbo].[Indices]    Script Date: 1/03/2025 11:05:53 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Indices]') AND type in (N'U'))
DROP TABLE [dbo].[Indices]
GO
/****** Object:  Table [dbo].[Clusters]    Script Date: 1/03/2025 11:05:54 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Clusters]') AND type in (N'U'))
DROP TABLE [dbo].[Clusters]
GO
/****** Object:  Table [dbo].[ApiKeys]    Script Date: 1/03/2025 11:05:54 AM ******/
IF  EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ApiKeys]') AND type in (N'U'))
DROP TABLE [dbo].[ApiKeys]
GO

create table RnaQuestions(
RnaQuestionId int not null primary key identity(1,1),
SearchMethodId int,
QuestionText varchar(500),
OverallRecallScore int,
OverallAccuracyScore int
);

create table RnaAnswers(
RnaAnswerId int not null primary key identity(1,1),
RnaQuestionId int,
RecallScore int,
AccuracyScore int
);


ALTER TABLE RnaAnswers
ADD CONSTRAINT FK_RnaAnswers_RnaQuestions
FOREIGN KEY (RnaQuestionId)
REFERENCES RnaQuestions(RnaQuestionId);




create table Clusters(
ClusterId int not null primary key identity(1,1),
Name varchar(500),
Description varchar(500),
KibanaUrl varchar(500),
EndpointUrl varchar(500),
EndpointUrl2 varchar(500)
);

insert into Clusters values (
'dummy',
'Dev environment.',
'https://kibana.1s1sxp2mcjk8.au-syd.codeengine.appdomain.cloud/login?next=%2F',
'https://d8ab8a92-4d3a-407c-87e4-90f82e0f3414.bsbaodss0vb4fikkn2bg.databases.appdomain.cloud:32319',
''
);


insert into Clusters values (
'esresearch',
'Azure hosted sandbox deployment.',
'https://esresearch.kb.westus2.azure.elastic-cloud.com',
'https://7441222d1c12456cae009f0c5f878e45.westus2.azure.elastic-cloud.com:443',
'https://esresearch.es.westus2.azure.elastic-cloud.com'
);

create table ApiKeys(
ApiKeyId int not null primary key identity(1,1),
ClusterId int not null,
Name varchar(500),
KeyType varchar(500),
KeyValue varchar(500));

ALTER TABLE ApiKeys
ADD CONSTRAINT FK_ApiKeys_Clusters
FOREIGN KEY (ClusterId)
REFERENCES Clusters(ClusterId);

insert into ApiKeys values (
1,
'dummy_key1',
'readwrite',
'ME5vblNwVUJyeXFHMzBJZWhHQ2s6SGNvUFVpQW5RaXVHYU1LQXVkbXhRZw=='
);

insert into ApiKeys values (
1,
'dummy_readonly',
'ReadOnly',
'RmVCM1JaVUJibllCMEw5ZGNXUHA6bTRjVXNmS3JTdUtjR013UEhlWVZyQQ=='
);

insert into ApiKeys values (
2,
'ReadWriteUser1',
'ReadWriteUser',
'cHdXaFJKVUJSa3k2ZlUzel9laUw6R0FUVkJEZi1ROWEwWUtUNFpRZHZ6UQ=='
);


insert into ApiKeys values (
1,
'ibm_cloud_add31bff_1b5c_483f_b713_1b4036c6721d',
'user',
'ff65eed7a3c7259d3808e43ca1a854b1f43a0cc2470ea433173cde163e29881d'
);

insert into ApiKeys values (
2,
'testuser1',
'user',
'ESResearch1'
);


create table Indices(
IndexId int not null primary key identity(1,1),
ClusterId int not null,
Name varchar(500),
Description varchar(500)
);

ALTER TABLE Indices
ADD CONSTRAINT FK_Indices_Clusters
FOREIGN KEY (ClusterId)
REFERENCES Clusters(ClusterId);

insert into Indices values (
1,
'dummy_index',
'');


insert into Indices values (
2,
'main',
'');









