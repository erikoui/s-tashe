/*
    creates a picture record
*/
INSERT INTO pictures(description, filename)
VALUES(${description}, ${filename})
RETURNING *
