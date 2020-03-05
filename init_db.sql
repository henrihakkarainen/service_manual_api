/* create table for devices */
CREATE TABLE device (
  deviceid SERIAL,
  dname VARCHAR(100) NOT NULL,
  dyear SMALLINT NOT NULL,
  dtype VARCHAR(40) NOT NULL,
  PRIMARY KEY (deviceid),
  UNIQUE (dname),
  CHECK (dyear > 1800 AND dyear < 2999)
);

/* create table for maintenance tasks */
CREATE TABLE task (
  taskid SERIAL,
  entry_date TIMESTAMP DEFAULT current_timestamp,
  descr VARCHAR(200) NOT NULL,
  prio VARCHAR(20) NOT NULL,
  mode VARCHAR(20) NOT NULL,
  deviceid INTEGER NOT NULL,
  PRIMARY KEY (taskid),
  FOREIGN KEY (deviceid) REFERENCES device,
  CHECK (prio IN ('critical', 'important', 'slight')),
  CHECK (mode IN ('open', 'done'))
);

/* insert some devices to database */
INSERT INTO device (dname, dyear, dtype) VALUES ('Device 1', 2004, 'Type 19');
INSERT INTO device (dname, dyear, dtype) VALUES ('Device 2', 1987, 'Type 2');
INSERT INTO device (dname, dyear, dtype) VALUES ('Device 3', 1995, 'Type 9');
INSERT INTO device (dname, dyear, dtype) VALUES ('Device 4', 2001, 'Type 33');
INSERT INTO device (dname, dyear, dtype) VALUES ('Device 5', 2013, 'Type 5');
INSERT INTO device (dname, dyear, dtype) VALUES ('Device 6', 1990, 'Type 15');
INSERT INTO device (dname, dyear, dtype) VALUES ('Device 7', 2001, 'Type 15');
INSERT INTO device (dname, dyear, dtype) VALUES ('Device 8', 1999, 'Type 2');
INSERT INTO device (dname, dyear, dtype) VALUES ('Device 9', 2004, 'Type 4');
INSERT INTO device (dname, dyear, dtype) VALUES ('Device 10', 2004, 'Type 10');