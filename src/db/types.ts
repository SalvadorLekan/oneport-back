import type { GeneratedAlways, ColumnType, Kysely } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Quote = {
  id: GeneratedAlways<string>;
  start_date: Timestamp;
  end_date: Timestamp;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  draft: Omit<Quote, "id" | "draft"> | null;
  title: string;
};

export type QuoteSection = {
  id: GeneratedAlways<string>;
  quote_id: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  title: string;
  base_currency: string;
  user_currency: string;
  uuid: string;
  exchange_rate: number;
};

export type SectionBasis = {
  id: GeneratedAlways<string>;
  quote_section_id: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  title: string;
  uuid: string;
  unit_of_measure: string;
  quantity: number;
  price_per_unit: number;
  quote_id: string;
};

export type DB = {
  quote: Quote;
  quote_section: QuoteSection;
  section_basis: SectionBasis;
};

export type KDB = Kysely<DB>;
