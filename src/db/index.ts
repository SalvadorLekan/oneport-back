import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

import { env } from "@/config/env";
import type { DB } from "./types";

const { Pool, types } = pg;

types.setTypeParser(types.builtins.INT8, (val) => Number(val));

const url = new URL(env.DATABASE_URL);

const dialect = new PostgresDialect({
  pool: new Pool({
    database: url.pathname.slice(1),
    host: url.hostname,
    user: url.username,
    port: Number(url.port),
    password: url.password,
    max: 10,
  }),
});

export const dbInit = {
  dialect,
};

export const db = new Kysely<DB>(dbInit);
