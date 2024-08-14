import { Kysely, sql } from "kysely";

export async function up(kysely: Kysely<any>) {
  await kysely.schema
    .createTable("quote")
    .ifNotExists()
    .addColumn("id", "uuid", (col) =>
      col
        .primaryKey()
        .notNull()
        .defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("start_date", "timestamptz", (col) => col.notNull())
    .addColumn("end_date", "timestamptz", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("draft", "jsonb")
    .addColumn("title", "text", (col) => col.notNull())
    .execute();

  await kysely.schema
    .createTable("quote_section")
    .ifNotExists()
    .addColumn("id", "uuid", (col) =>
      col
        .primaryKey()
        .notNull()
        .defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("quote_id", "uuid", (col) => col.notNull().references("quote.id").onDelete("cascade"))
    .addColumn("uuid", "uuid", (col) => col.notNull().unique())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("base_currency", "text", (col) => col.notNull())
    .addColumn("user_currency", "text", (col) => col.notNull())
    .addColumn("exchange_rate", "numeric", (col) => col.notNull())
    .execute();

  await kysely.schema
    .createTable("section_basis")
    .ifNotExists()
    .addColumn("id", "uuid", (col) =>
      col
        .primaryKey()
        .notNull()
        .defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("quote_section_id", "uuid", (col) => col.notNull().references("quote_section.id").onDelete("cascade"))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("uuid", "uuid", (col) => col.notNull().unique())
    .addColumn("quote_id", "uuid", (col) => col.notNull().references("quote.id").onDelete("cascade"))
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("unit_of_measure", "text", (col) => col.notNull())
    .addColumn("quantity", "numeric", (col) => col.notNull())
    .addColumn("price_per_unit", "numeric", (col) => col.notNull())
    .execute();
}

export async function down(kysely: Kysely<any>) {
  await kysely.schema.dropTable("section_basis").ifExists().execute();
  await kysely.schema.dropTable("quote_section").ifExists().execute();
  await kysely.schema.dropTable("quote").ifExists().execute();
}
