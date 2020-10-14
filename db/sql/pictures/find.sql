/*
    Finds a product by user id + product name.
*/
SELECT * FROM pictures
WHERE user_id = ${userId} AND name = ${pictureName}
