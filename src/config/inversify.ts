import { db } from "@/db";
import { QuotesRepository } from "@/repositories/quotes.repo";
import { Container } from "inversify";
import { InversifyTypes } from "./InversifyTypes";

export function setupContainer() {
  const container = new Container();

  container.bind(InversifyTypes.Kysely).toConstantValue(db);
  container.bind(InversifyTypes.QuotesRepository).to(QuotesRepository);

  return container;
}
