/*
    Inserts a new User record.
*/
INSERT INTO public.users(uname,points,password,deleted)
VALUES(${username},0,${password},false)
RETURNING *
