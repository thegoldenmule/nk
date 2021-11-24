#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE "nk";

    \c nk
    /* User table */
    create table "user"
    (
        "id" text not null,
        "pk" text not null
    );

    comment on table "user" is 'User database.';

    create unique index user_id_uindex
        on "user" ("id");

    alter table "user"
        add constraint user_pk
            primary key ("id");

    /* Datum table */
    create table "datum"
    (
        "id" serial,
        "userId" text,
        "key" text,
        "data" text,
        "iv" text
    );

    comment on table "datum" is 'Stores individual data.';

    create unique index datum_id_uindex
        on "datum" ("id");

    alter table "datum"
        add constraint datum_pk
            primary key ("id");

    /* Proof models */
    create table proof
    (
        "id" serial,
        "pPlaintext" text,
        "userId" text
    );

    create unique index proof_id_uindex
        on proof ("id");

    alter table proof
        add constraint proof_pk
            primary key ("id");

EOSQL