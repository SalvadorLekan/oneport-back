import type { KDB } from "@/db/types";
import { InversifyTypes } from "@/config/InversifyTypes";
import type { CreateQuote, GetQuoteQuery, UpdateQuote } from "@/schemas/quotes.schema";
import { inject, injectable } from "inversify";
import { pick } from "lodash";
import { ApplicationError } from "@/config/errors";
import { jsonArrayFrom } from "kysely/helpers/postgres";

@injectable()
export class QuotesRepository {
  @inject(InversifyTypes.Kysely) private db: KDB;

  async getQuotes(query: GetQuoteQuery) {
    let builder = this.db.selectFrom("quote").selectAll();

    if (query.start_date) {
      builder = builder.where("start_date", ">=", query.start_date);
    }

    if (query.end_date) {
      builder = builder.where("end_date", "<=", query.end_date);
    }

    return builder
      .select(({ eb }) =>
        jsonArrayFrom(
          eb
            .selectFrom("quote_section")
            .select(["base_currency", "user_currency", "exchange_rate"])
            .select(({ eb }) =>
              jsonArrayFrom(
                eb
                  .selectFrom("section_basis")
                  .whereRef("section_basis.quote_section_id", "=", "quote_section.id")
                  .select(["price_per_unit", "quantity"])
              ).as("basis")
            )
            .whereRef("quote_id", "=", "quote.id")
        ).as("sections")
      )
      .orderBy("start_date", "asc")
      .execute();
  }

  async getQuoteById(id: string) {
    return this.db
      .selectFrom("quote")
      .select(["created_at", "updated_at", "title", "start_date", "end_date", "id", "draft"])
      .select(({ eb }) =>
        jsonArrayFrom(
          eb
            .selectFrom("quote_section")
            .selectAll()
            .select(({ eb }) =>
              jsonArrayFrom(
                eb
                  .selectFrom("section_basis")
                  .whereRef("section_basis.quote_section_id", "=", "quote_section.id")
                  .selectAll()
              ).as("basis")
            )
            .whereRef("quote_id", "=", "quote.id")
        ).as("sections")
      )
      .where("id", "=", id)
      .executeTakeFirstOrThrow(() => {
        throw new ApplicationError(`Quote not ${id} found`, 404);
      });
  }

  async createQuote(quote: CreateQuote) {
    return this.db.transaction().execute(async (trx) => {
      const base = pick(quote, ["title", "start_date", "end_date"]);

      const created = await trx.insertInto("quote").values(base).returningAll().executeTakeFirstOrThrow();

      const sectionsPromise = quote.sections.map(async (section) => {
        const { basis, ...others } = section;
        const createdSection = await trx
          .insertInto("quote_section")
          .values({ ...others, quote_id: created.id })
          .returningAll()
          .executeTakeFirstOrThrow();

        const createdBasis = await trx
          .insertInto("section_basis")
          .values(basis.map((b) => ({ ...b, quote_section_id: createdSection.id, quote_id: created.id })))
          .returningAll()
          .execute();

        return { ...createdSection, basis: createdBasis };
      });

      const sections = await Promise.all(sectionsPromise);

      return { ...created, sections };
    });
  }

  async updateQuote(id: string, quote: UpdateQuote) {
    return this.db.transaction().execute(async (trx) => {
      const base = pick(quote, ["title", "start_date", "end_date"]);

      // @ts-ignore
      base.updated_at = new Date();
      // @ts-ignore
      base.draft = null;

      const updated = await trx
        .updateTable("quote")
        .set(base)
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirstOrThrow(() => {
          throw new ApplicationError(`Quote not ${id} found`, 404);
        });

      if (quote.sections) {
        await trx
          .deleteFrom("quote_section")
          .where("quote_id", "=", id)
          .where(
            "uuid",
            "not in",
            quote.sections.map((section) => section.uuid)
          )
          .execute();

        const sectionsPromise = quote.sections.map(async (section) => {
          const { basis, ...others } = section;
          const createdSection = await trx
            .insertInto("quote_section")
            .values({ ...others, quote_id: id, updated_at: new Date() })
            .onConflict((oc) => oc.column("uuid").doUpdateSet(others))
            .returningAll()
            .executeTakeFirstOrThrow();

          await trx
            .deleteFrom("section_basis")
            .where("quote_section_id", "=", createdSection.id)
            .where(
              "uuid",
              "not in",
              basis.map((b) => b.uuid)
            )
            .execute();

          const createdBasis = await trx
            .insertInto("section_basis")
            .values(
              basis.map((b) => ({ ...b, quote_section_id: createdSection.id, quote_id: id, updated_at: new Date() }))
            )
            .onConflict((oc) =>
              oc.column("uuid").doUpdateSet(({ eb }) => ({
                title: eb.ref("excluded.title"),
                unit_of_measure: eb.ref("excluded.unit_of_measure"),
                quantity: eb.ref("excluded.quantity"),
                price_per_unit: eb.ref("excluded.price_per_unit"),
              }))
            )
            .returningAll()
            .execute();

          return { ...createdSection, basis: createdBasis };
        });

        const sections = await Promise.all(sectionsPromise);

        return { ...updated, sections };
      }
      return updated;
    });
  }

  async saveToDraft(id: string, draft: any) {
    return this.db
      .updateTable("quote")
      .set({ draft })
      .where("id", "=", id)
      .returning("draft")
      .executeTakeFirstOrThrow(() => {
        throw new ApplicationError(`Quote not ${id} found`, 404);
      });
  }
}
