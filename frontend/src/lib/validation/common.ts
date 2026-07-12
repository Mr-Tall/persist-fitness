import { z } from "zod";

export const MAX_ID_LENGTH = 200;

export const boundedIdSchema = z
  .string()
  .trim()
  .min(1, "A required ID is missing.")
  .max(MAX_ID_LENGTH, "A provided ID is too long.");

export function optionalTrimmedStringSchema(
  maxLength: number,
  tooLongMessage: string
) {
  return z.preprocess(
    (value) => {
      if (value === null || value === undefined) {
        return undefined;
      }

      if (typeof value !== "string") {
        return value;
      }

      const normalized = value.trim();
      return normalized.length === 0 ? undefined : normalized;
    },
    z.string().max(maxLength, tooLongMessage).optional()
  );
}

export function optionalNumberSchema<T extends z.ZodNumber>(schema: T) {
  return z.preprocess(
    (value) => {
      if (value === null || value === undefined) {
        return undefined;
      }

      if (typeof value === "string") {
        const normalized = value.trim();
        return normalized.length === 0 ? undefined : Number(normalized);
      }

      return value;
    },
    schema.optional()
  );
}
