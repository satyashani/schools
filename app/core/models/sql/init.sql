/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/**
 * Author:  shani
 * Created: 23 Dec, 2017
 */

CREATE TABLE IF NOT EXISTS version (value integer default 0);
INSERT INTO version (value) SELECT 1 WHERE NOT EXISTS (SELECT * FROM version LIMIT 1);
UPDATE version SET value = 1;

CREATE TABLE settings (
    key     varchar(20),
    name    varchar(100),
    value   jsonb,    
    CONSTRAINT idx_settings PRIMARY KEY ( key )
);

CREATE TABLE session ( 
    s                    varchar(255)  NOT NULL,
    sess                 jsonb  ,
    validtill            timestamp DEFAULT current_timestamp NOT NULL,
    CONSTRAINT pk_session PRIMARY KEY ( s )
 );

CREATE TABLE cronjobs (
    cronname        varchar(20)     PRIMARY KEY,
    starttime       timestamptz,
    timeperiod      integer,
    params          jsonb 
);

CREATE TABLE cronevents (
    id          serial,
    cronname    VARCHAR(20),
    starttime   timestamptz,
    raised      integer DEFAULT 0,
    lastraised  timestamp,
    status      integer DEFAULT 0,
    params      jsonb,
    PRIMARY KEY (cronname,starttime)
);

CREATE TABLE users (
    id          serial,
    name        varchar(50),
    username    varchar(30),
    email       varchar(30),
    phone       varchar(30),
    password    varchar(50),
    picture     varchar(50),
    roleid      integer,
    CONSTRAINT  idx_users PRIMARY KEY ( id ),
    CONSTRAINT  idx_username UNIQUE username, 
    CONSTRAINT  fk_roleid FOREIGN KEY ( roleid ) REFERENCES roles( id )
);

CREATE TABLE roles (
    id      serial,
    name    varchar(20),
    CONSTRAINT idx_roles PRIMARY KEY ( id ),
);

CREATE TABLE student (
    userid              integer ,
    registrationdate    date,
    standard            integer,
    stream              integer,
    section             integer,
    CONSTRAINT idx_userid PRIMARY KEY ( userid ),
    CONSTRAINT fk_userid FOREIGN KEY ( userid ) REFERENCES users( id ) ON DELETE CASCADE
);

CREATE TABLE standard (
    id      serial,
    name    varchar(20)
);

CREATE TABLE streams (
    id          serial,
    name        varchar(20),
    standardid  integer,
    CONSTRAINT idx_streams PRIMARY KEY ( id ),
    CONSTRAINT fk_standardid FOREIGN KEY ( standardid ) REFERENCES standard( id ) ON DELETE CASCADE    
);

CREATE TABLE sections (
    id          serial,
    name        varchar(20),
    streamid    integer,
    CONSTRAINT idx_section PRIMARY KEY ( id ),
    CONSTRAINT fk_streamid FOREIGN KEY ( streamid ) REFERENCES stream( id ) ON DELETE CASCADE    
);

CREATE TABLE subjects (
    id      serial,
    name    varchar(30)
);

CREATE TABLE streamsbj (
    streamid    integer,
    subjectid   integer,
    CONSTRAINT  idx_streamsbj PRIMARY KEY  (streamid,subjectid),
    CONSTRAINT fk_streamid FOREIGN KEY ( streamid ) REFERENCES stream( id ) ON DELETE CASCADE,
    CONSTRAINT fk_subjectid FOREIGN KEY ( subjectid ) REFERENCES subject( id ) ON DELETE CASCADE
);

CREATE TABLE attendance (
    userid          integer,
    presentdate     date,
    present         boolean,
    CONSTRAINT  idx_attendance PRIMARY KEY  (userid,presentdate),
    CONSTRAINT fk_userid FOREIGN KEY ( userid ) REFERENCES users ( id ) ON DELETE CASCADE
);

CREATE TABLE teacherprofile (
    userid      integer,
    highestdeg  varchar(30),
    CONSTRAINT fk_userid FOREIGN KEY ( userid ) REFERENCES users ( id ) ON DELETE CASCADE
);

CREATE TABLE teachersubjects (
    userid      integer,
    subjectid   integer,
    CONSTRAINT fk_subjectid FOREIGN KEY ( subjectid ) REFERENCES subjects ( id ) ON DELETE CASCADE
    CONSTRAINT fk_userid FOREIGN KEY ( userid ) REFERENCES users ( id ) ON DELETE CASCADE
);

CREATE TABLE classteacher (
    sectionid       integer,
    userid          integer,
    CONSTRAINT idx_classteacher PRIMARY KEY  (sectionid,userid),
    CONSTRAINT fk_sectionid FOREIGN KEY ( sectionid ) REFERENCES sections ( id ) ON DELETE CASCADE    
    CONSTRAINT fk_userid FOREIGN KEY ( userid ) REFERENCES users( id ) ON DELETE CASCADE
);

CREATE TABLE period (
    id              serial,
    starttime       varchar(15),
    endtime         varchar(15),
    isbreak         boolean
);

CREATE TABLE timetable (
    periodid        integer,
    tdate           date,
    sectionid       integer,
    streamid        integer,
    subjectid       integer,
    teacherid       integer,
    CONSTRAINT idx_timetable PRIMARY KEY  (periodid,tdate,sectionid,streamid,subjectid),
    CONSTRAINT fk_periodid FOREIGN KEY ( periodid ) REFERENCES period ( id ) ON DELETE CASCADE  , 
    CONSTRAINT fk_secionid FOREIGN KEY ( sectionid ) REFERENCES sections ( id ) ON DELETE CASCADE,
    CONSTRAINT fk_streamid FOREIGN KEY ( streamid,subjectid ) REFERENCES streamsbj ( streamid,subjectid ) ON DELETE CASCADE,
    CONSTRAINT fk_teacherid FOREIGN KEY ( teacherid ) REFERENCES teachersubjects ( userid ) ON DELETE CASCADE
);

