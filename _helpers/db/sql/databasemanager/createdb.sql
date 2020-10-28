--
-- Creates the database with admin user and some tags.
-- Use restore function from pgAdmin rather than run this from the node server.

-- PostgreSQL database dump
-- Created by:
--   in pgAdmin right click on the database
--   click backup
--   set filename and type sql
--   format plain
--   dump options only schema
--   no owner
--   no priviledges
--   include CREATE database
--
--   database name was changed to something readable
--
-- PostgreSQL database dump
--

-- Dumped from database version 12.4 (Ubuntu 12.4-1.pgdg16.04+1)
-- Dumped by pg_dump version 13.0

-- Started on 2020-10-25 12:32:01

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 207 (class 1259 OID 17230039)
-- Name: pictures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pictures (
    id integer NOT NULL,
    description text,
    votes integer DEFAULT 0,
    views integer DEFAULT 0,
    filename text NOT NULL,
    tags text[]
);


--
-- TOC entry 206 (class 1259 OID 17230037)
-- Name: pictures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pictures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3873 (class 0 OID 0)
-- Dependencies: 206
-- Name: pictures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pictures_id_seq OWNED BY public.pictures.id;


--
-- TOC entry 205 (class 1259 OID 17229886)
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    tag text NOT NULL,
    alts text[],
    nsfw boolean
);


--
-- TOC entry 204 (class 1259 OID 17229884)
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3874 (class 0 OID 0)
-- Dependencies: 204
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- TOC entry 203 (class 1259 OID 16819139)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    uname text NOT NULL,
    points integer,
    password text NOT NULL,
    id integer NOT NULL,
    deleted boolean,
    admin boolean,
    joinedon timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 202 (class 1259 OID 16819137)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3875 (class 0 OID 0)
-- Dependencies: 202
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3721 (class 2604 OID 17230042)
-- Name: pictures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pictures ALTER COLUMN id SET DEFAULT nextval('public.pictures_id_seq'::regclass);


--
-- TOC entry 3720 (class 2604 OID 17229889)
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- TOC entry 3718 (class 2604 OID 16819142)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3865 (class 0 OID 17230039)
-- Dependencies: 207
-- Data for Name: pictures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pictures (id, description, votes, views, filename, tags) FROM stdin;
\.


--
-- TOC entry 3863 (class 0 OID 17229886)
-- Dependencies: 205
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tags (id, tag, alts, nsfw) FROM stdin;
1	asian	{asians,chinks,chink}	t
2	latex	\N	t
3	bimbo	{fake}	t
4	insta	{social,fb,instagram,vsco}	t
6	ylyl	\N	f
\.


--
-- TOC entry 3861 (class 0 OID 16819139)
-- Dependencies: 203
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (uname, points, password, id, deleted, joinedon) FROM stdin;
admin	23	d033e22ae348aeb5660fc2140aec35850c4da997	1	f	2020-10-13 20:19:32.775983+00
\.


--
-- TOC entry 3876 (class 0 OID 0)
-- Dependencies: 206
-- Name: pictures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pictures_id_seq', 360, true);


--
-- TOC entry 3877 (class 0 OID 0)
-- Dependencies: 204
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tags_id_seq', 6, true);


--
-- TOC entry 3878 (class 0 OID 0)
-- Dependencies: 202
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- TOC entry 3733 (class 2606 OID 17230049)
-- Name: pictures pictures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pictures
    ADD CONSTRAINT pictures_pkey PRIMARY KEY (id);


--
-- TOC entry 3729 (class 2606 OID 17229894)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- TOC entry 3731 (class 2606 OID 17229896)
-- Name: tags tags_tag_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_tag_key UNIQUE (tag);


--
-- TOC entry 3725 (class 2606 OID 16819150)
-- Name: users unique usernames; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "unique usernames" UNIQUE (uname);


--
-- TOC entry 3727 (class 2606 OID 16819148)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3871 (class 0 OID 0)
-- Dependencies: 3
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

REVOKE ALL ON SCHEMA public FROM postgres;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO etydxociqwbhqg;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- TOC entry 3872 (class 0 OID 0)
-- Dependencies: 641
-- Name: LANGUAGE plpgsql; Type: ACL; Schema: -; Owner: -
--

GRANT ALL ON LANGUAGE plpgsql TO etydxociqwbhqg;


-- Completed on 2020-10-25 12:32:11

--
-- PostgreSQL database dump complete
--

