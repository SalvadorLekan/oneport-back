import { FileMigrationProvider, Migrator } from "kysely";
import { promises as fs } from "fs";
import path from "path";
import { db } from ".";

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.resolve(import.meta.dirname, "migrations"),
  }),
});

const { results, error } = await migrator.migrateToLatest();

if (error) {
  console.error(error);
  process.exit(1);
}

results?.forEach((result) => {
  console.log(result);
});
