import { expect, expectTypeOf, test } from "vitest";
import * as z from "zod/v4";

test("type inference", () => {
  const booleanRecord = z.record(z.string(), z.boolean());
  type booleanRecord = typeof booleanRecord._output;

  const recordWithEnumKeys = z.record(z.enum(["Tuna", "Salmon"]), z.string());
  type recordWithEnumKeys = z.infer<typeof recordWithEnumKeys>;

  const recordWithLiteralKey = z.record(z.literal(["Tuna", "Salmon", 21]), z.string());
  type recordWithLiteralKey = z.infer<typeof recordWithLiteralKey>;

  const recordWithLiteralUnionKeys = z.record(
    z.union([z.literal("Tuna"), z.literal("Salmon"), z.literal(21)]),
    z.string()
  );
  type recordWithLiteralUnionKeys = z.infer<typeof recordWithLiteralUnionKeys>;

  enum Enum {
    Tuna = 0,
    Salmon = "Shark",
  }

  const recordWithTypescriptEnum = z.record(z.enum(Enum), z.string());
  type recordWithTypescriptEnum = z.infer<typeof recordWithTypescriptEnum>;

  expectTypeOf<booleanRecord>().toEqualTypeOf<Record<string, boolean>>();
  expectTypeOf<recordWithEnumKeys>().toEqualTypeOf<Record<"Tuna" | "Salmon", string>>();
  expectTypeOf<recordWithLiteralKey>().toEqualTypeOf<Record<"Tuna" | "Salmon" | 21, string>>();
  expectTypeOf<recordWithLiteralUnionKeys>().toEqualTypeOf<Record<"Tuna" | "Salmon" | 21, string>>();
  expectTypeOf<recordWithTypescriptEnum>().toEqualTypeOf<Record<Enum, string>>();
});