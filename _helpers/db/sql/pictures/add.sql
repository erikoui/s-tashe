/*
    creates a picture record
*/
INSERT INTO pictures(description, filename, tags)
VALUES(${description}, ${filename}, ${tags})
RETURNING *
