/*
    Creates table Users.
*/
CREATE TABLE public.users
(
    uname text COLLATE pg_catalog."default" NOT NULL,
    points integer,
    password text COLLATE pg_catalog."default" NOT NULL,
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    deleted boolean,
    joinedon timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT "unique usernames" UNIQUE (uname)
)

TABLESPACE pg_default;

ALTER TABLE public.users
    OWNER to etydxociqwbhqg;