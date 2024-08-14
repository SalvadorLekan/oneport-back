import zod from "zod";

const envSchema = zod
  .object({
    NODE_ENV: zod.enum(["development", "test", "production"]).default("development"),
    PORT: zod.coerce.number().int().default(3000),
    DATABASE_URL: zod
      .string()
      .trim()
      .url()
      .refine((url) => {
        const urlObj = new URL(url);
        return urlObj.protocol === "postgresql:";
      }, "Invalid PostgreSQL URL"),
  })
  .required();

export const env = envSchema.parse(process.env);
