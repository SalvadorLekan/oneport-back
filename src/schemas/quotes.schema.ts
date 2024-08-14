import zod from "zod";
import { dateRange } from "./query-filter.schema";

const currencies = Intl.supportedValuesOf("currency") as [string, ...string[]];
const currencySchema = zod.enum(currencies, { message: "Invalid currency" });
export const createQuoteSchema = zod
  .object({
    title: zod.string().min(1).max(100),
    start_date: zod.coerce.date(),
    end_date: zod.coerce.date(),
    sections: zod
      .array(
        zod
          .object({
            title: zod.string().min(1).max(100),
            uuid: zod.string().uuid(),
            base_currency: currencySchema,
            user_currency: currencySchema,
            exchange_rate: zod.coerce.number().gt(0),
            basis: zod
              .array(
                zod
                  .object({
                    title: zod.string().min(1).max(100),
                    uuid: zod.string().uuid(),
                    unit_of_measure: zod.string().min(1).max(100),
                    quantity: zod.coerce.number().int().min(1),
                    price_per_unit: zod.coerce.number().gt(0),
                  })
                  .required()
              )
              .min(1),
          })
          .required()

          .transform((value) => {
            if (value.user_currency === value.base_currency) {
              value.exchange_rate = 1;
            }
            return value;
          })
      )
      .min(1),
  })
  .required();

export type CreateQuote = zod.infer<typeof createQuoteSchema>;

export const updateQuoteSchema = createQuoteSchema.partial();
export type UpdateQuote = zod.infer<typeof updateQuoteSchema>;

export const deepPartialQuoteSchema = createQuoteSchema.deepPartial();
export type DeepPartialQuote = zod.infer<typeof deepPartialQuoteSchema>;

export const draftQuoteSchema = zod
  .object({
    title: zod.string().max(100),
    start_date: zod.coerce.date(),
    end_date: zod.coerce.date(),
    sections: zod
      .array(
        zod
          .object({
            title: zod.string().min(1).max(100),
            uuid: zod.string().uuid(),
            base_currency: currencySchema,
            user_currency: currencySchema,
            exchange_rate: zod.coerce.number().gt(0),
            basis: zod
              .array(
                zod
                  .object({
                    title: zod.string().min(1).max(100),
                    uuid: zod.string().uuid(),
                    unit_of_measure: zod.string().min(1).max(100),
                    quantity: zod.coerce.number().int().min(1),
                    price_per_unit: zod.coerce.number().gt(0),
                  })
                  .required()
                  .partial()
              )
              .optional(),
          })
          .required()
          .partial()
      )
      .optional(),
  })
  .required()
  .partial();
export type DraftQuote = zod.infer<typeof draftQuoteSchema>;

export const getQuoteSchema = zod.object({
  ...dateRange,
});
export type GetQuoteQuery = zod.infer<typeof getQuoteSchema>;
