import zod from "zod";

export const limitable = {
  limit: zod.coerce.number().optional(),
  offset: zod.coerce.number().optional(),
};

export const dateRange = {
  start_date: zod.coerce.date().optional(),
  end_date: zod.coerce.date().optional(),
};
