import { z } from "zod";

// Phase 0: only the health response is shared. Real schemas (Posting, Source, etc.)
// land alongside their feature in Phase 1+.

export const HealthStatus = z.object({
  status: z.enum(["ok", "degraded", "down"]),
  service: z.string(),
  uptimeSeconds: z.number(),
  checks: z.record(z.string(), z.enum(["ok", "down"])).optional(),
});

export type HealthStatus = z.infer<typeof HealthStatus>;
