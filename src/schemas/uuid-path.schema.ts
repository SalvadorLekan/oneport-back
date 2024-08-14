import zod from "zod";
export const uuidPath = zod
  .object({
    id: zod.string().uuid(),
  })
  .required();
