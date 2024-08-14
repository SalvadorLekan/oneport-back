import { ApplicationError } from "@/config/errors";
import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.log(err);
  if (res.headersSent) return next(err);
  if (err && err instanceof ApplicationError) {
    res.status(err.code).json({ message: err.message, data: err.data });
  } else res.status(500).json({ message: "Internal Server Error" });
}
