/*
    Inserts a new User record.
*/
INSERT INTO public.users(uname,points,password,deleted,admin)
VALUES(${username},0,${password},false,false)
RETURNING *
