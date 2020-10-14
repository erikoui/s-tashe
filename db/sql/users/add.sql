/*
    Inserts a new User record.
*/
INSERT INTO public.users(uname,points,password,deleted)
VALUES($1,0,$2,false)
RETURNING *
