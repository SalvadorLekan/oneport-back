import { InversifyTypes } from "@/config/InversifyTypes";
import { validateRequest } from "@/middlewares";
import { inject } from "inversify";
import {
  controller,
  httpGet,
  httpPatch,
  httpPost,
  httpPut,
  queryParam,
  requestBody,
  requestParam,
} from "inversify-express-utils";
import {
  createQuoteSchema,
  deepPartialQuoteSchema,
  draftQuoteSchema,
  getQuoteSchema,
  updateQuoteSchema,
} from "@/schemas/quotes.schema";
import type { CreateQuote, GetQuoteQuery } from "@/schemas/quotes.schema";
import type { QuotesRepository } from "@/repositories/quotes.repo";
import { uuidPath } from "@/schemas/uuid-path.schema";

@controller("/quotes")
export class QuotesController {
  @inject(InversifyTypes.QuotesRepository) private repo: QuotesRepository;

  @httpGet("/", validateRequest(getQuoteSchema, "query"))
  getQuotes(@queryParam() query: GetQuoteQuery) {
    return this.repo.getQuotes(query);
  }

  @httpGet("/:id", validateRequest(uuidPath, "params"))
  getQuoteById(@requestParam("id") id: string) {
    return this.repo.getQuoteById(id);
  }

  @httpPost("/", validateRequest(createQuoteSchema, "body"))
  createQuote(@requestBody() quote: CreateQuote) {
    return this.repo.createQuote(quote);
  }

  @httpPatch("/:id", validateRequest(uuidPath, "params"), validateRequest(updateQuoteSchema, "body"))
  updateQuote(@requestParam("id") id: string, @requestBody() quote: CreateQuote) {
    return this.repo.updateQuote(id, quote);
  }

  @httpPut("/:id/draft", validateRequest(uuidPath, "params"), validateRequest(draftQuoteSchema, "body"))
  updateQuoteDraft(@requestParam("id") id: string, @requestBody() quote: CreateQuote) {
    return this.repo.saveToDraft(id, quote);
  }
}
