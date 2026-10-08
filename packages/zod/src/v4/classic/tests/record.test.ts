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

test("enum exhaustiveness", () => {
  const schema = z.record(z.enum(["Tuna", "Salmon"]), z.string());
  expect(
    schema.parse({
      Tuna: "asdf",
      Salmon: "asdf",
    })
  ).toEqual({
    Tuna: "asdf",
    Salmon: "asdf",
  });

  expect(schema.safeParse({ Tuna: "asdf", Salmon: "asdf", Trout: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [ZodError: [
      {
        "code": "unrecognized_keys",
        "keys": [
          "Trout"
        ],
        "path": [],
        "message": "Unrecognized key: \\"Trout\\""
      }
    ]],
      "success": false,
    }
  `);
  expect(schema.safeParse({ Tuna: "asdf" })).toMatchInlineSnapshot(`
    {
      "error": [ZodError: [
      {
        "expected": "string",
        "code": "invalid_type",
        "path": [
          "Salmon"
        ],
        "message": "Invalid input: expected string, received undefined"
      }
    ]],
      "success": false,
    }
  `);
});

test("optional-in value type", () => {
  const defaulted = z.record(z.enum(["Tuna", "Salmon"]), z.string().default("unknown"));
  expectTypeOf<z.input<typeof defaulted>>().toEqualTypeOf<Partial<Record<"Tuna" | "Salmon", string | undefined>>>();
  expectTypeOf<z.output<typeof defaulted>>().toEqualTypeOf<Record<"Tuna" | "Salmon", string>>();
  expect(defaulted.parse({ Tuna: "asdf" })).toEqual({ Tuna: "asdf", Salmon: "unknown" });

  const prefaulted = z.record(z.enum(["Tuna", "Salmon"]), z.string().prefault("unknown"));
  expectTypeOf<z.input<typeof prefaulted>>().toEqualTypeOf<Partial<Record<"Tuna" | "Salmon", string | undefined>>>();
  expect(prefaulted.parse({ Tuna: "asdf" })).toEqual({ Tuna: "asdf", Salmon: "unknown" });

  const optional = z.record(z.enum(["Tuna", "Salmon"]), z.string().optional());
  expectTypeOf<z.input<typeof optional>>().toEqualTypeOf<Partial<Record<"Tuna" | "Salmon", string | undefined>>>();
  // toStrictEqual, not toEqual: an exhaustive record assigns every key, and toEqual cannot tell an absent key from one holding undefined.
  expect(optional.parse({ Tuna: "asdf" })).toStrictEqual({ Tuna: "asdf", Salmon: undefined });

  // A value that needs a slot keeps the key required, and a non-enumerable key stays an index signature either way.
  const required = z.record(z.enum(["Tuna", "Salmon"]), z.string());
  expectTypeOf<z.input<typeof required>>().toEqualTypeOf<Record<"Tuna" | "Salmon", string>>();
  const indexed = z.record(z.string(), z.string().default("unknown"));
  expectTypeOf<z.input<typeof indexed>>().toEqualTypeOf<Record<string, string | undefined>>();

  // A catch and a preprocess pipe declare no static optin, so the key stays required even where the parser can fill it. The static predicate and the one the JSON Schema emitter uses resolve these differently, and the two have to keep agreeing.
  const caught = z.record(z.enum(["Tuna", "Salmon"]), z.string().catch("unknown"));
  expectTypeOf<z.input<typeof caught>>().toEqualTypeOf<Record<"Tuna" | "Salmon", string>>();
  const preprocessed = z.record(
    z.enum(["Tuna", "Salmon"]),
    z.preprocess((v) => v, z.string())
  );
  expectTypeOf<z.input<typeof preprocessed>>().toEqualTypeOf<Record<"Tuna" | "Salmon", unknown>>();
});