/*
    Adds a new Product for the specified User.
*/
INSERT INTO pictures(user_id, name)
VALUES(${userId}, ${pictureName})
RETURNING *
