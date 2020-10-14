/*
    Creates table Products.
*/
CREATE TABLE pictures
(
    id serial PRIMARY KEY,
    user_id int not null references users(id),
    name text NOT NULL
)
