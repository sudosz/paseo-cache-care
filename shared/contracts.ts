import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";
export const entry = z.object({ id: z.string(), name: z.string(), layer: z.string(), description: z.string(), available: z.boolean(), reason: z.string(), optional: z.boolean(), bytes: z.number().nullable(), path: z.string().nullable(), cleanable: z.boolean() });
export type Entry = z.infer<typeof entry>;
export const disk = z.object({ total: z.number(), free: z.number(), used: z.number() });
export const space = z.object({ path: z.string(), bytes: z.number() });
export const scan = defineRpc({ name: "care.scan", input: z.object({}), output: z.object({ token: z.string(), platform: z.string(), entries: z.array(entry), disk, space: z.array(space) }) });
export const clean = defineRpc({ name: "care.clean", input: z.object({ token: z.string(), ids: z.array(z.string()).min(1).max(40) }), output: z.object({ results: z.array(z.object({ id: z.string(), ok: z.boolean(), message: z.string() })), reclaimedBytes: z.number() }) });
