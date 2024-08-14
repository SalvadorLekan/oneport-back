import "core-js";
import "reflect-metadata";
import { setupContainer } from "@/config/inversify";
import { env } from "@/config/env";
import { setupServer } from "./config/server";
import "@/controllers";

const container = setupContainer();

let server = setupServer(container);

let app = server.build();

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
