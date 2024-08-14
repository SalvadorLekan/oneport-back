import fs from "fs";
import path from "path";

let identifier = process.argv[2]?.trim();
const content = /* ts */ `import type { Kysely } from "kysely";

export async function up(kysely: Kysely<any>) {}

export async function down(kysely: Kysely<any>) {}
`;

getIdentifier();

function getIdentifier() {
  if (!identifier) {
    console.log("Enter a migration name: \n");
    process.stdin.on("data", function (data) {
      identifier = data.toString().trim();

      process.stdin.removeAllListeners();
      process.stdin.pause();

      getIdentifier();
    });
  } else {
    generateMigrationFile();
  }
}

function generateMigrationFile() {
  const now = new Date();
  const { format } = Intl.NumberFormat("en", { minimumIntegerDigits: 2, useGrouping: false });
  const timestamp = `${now.getFullYear()}${format(now.getMonth())}${format(now.getDate())}${format(
    now.getHours()
  )}${format(now.getMinutes())}${format(now.getSeconds())}`;

  const migrationFile = path.join(
    import.meta.dirname,
    "migrations",
    `${timestamp}_${identifier.replace(/[^a-zA-Z0-9_]+/g, "_").replace(/_+$/, "")}.ts`
  );

  fs.writeFileSync(migrationFile, content);
}
