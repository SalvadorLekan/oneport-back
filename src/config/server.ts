import type { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "@/middlewares/errors";

export function setupServer(container: Container) {
  let server = new InversifyExpressServer(container);
  server.setConfig((app) => {
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(helmet());
  });

  server.setErrorConfig((app) => {
    app.get("/", (_, res) => {
      res.json({ message: "Up and Grateful" });
    });
    app.use("*", (req, res) => {
      res.status(404).json({ message: `Resource for ${req.method}: ${req.baseUrl}  was not found on this server` });
    });
    app.use(errorHandler);
  });

  return server;
}
