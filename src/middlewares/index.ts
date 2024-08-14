import type { NextFunction, Request, Response } from "express";
import zod, { ZodObject, ZodError } from "zod";

const filterEmptyStrings = (schema: ZodObject<any>) => {
  return zod.preprocess((data: any) => {
    if (typeof data !== "object" || data === null) {
      return {};
    }
    for (const key in data) {
      if (!data[key]) {
        delete data[key];
      }
    }
    return data;
  }, schema);
};

export function validateRequest(schema: ZodObject<any>, context: "body" | "query" | "params" | "headers" = "body") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (context === "query") {
        // @ts-ignore
        schema = filterEmptyStrings(schema);
      }
      req[context] = schema.parse(req[context]);
      next();
    } catch (e) {
      if (e && e instanceof ZodError) {
        res.status(400).json({ message: `Your request ${context} is invalid`, errors: e.errors });
      } else throw e;
    }
  };
}
