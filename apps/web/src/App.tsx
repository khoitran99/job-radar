import { useEffect, useState } from "react";
import { HealthStatus } from "@jobradar/shared-types";

type Probe = { url: string; label: string };

const PROBES: Probe[] = [
  { url: "/api/health/live", label: "API liveness" },
  { url: "/api/health/ready", label: "API readiness" },
];

export function App() {
  const [results, setResults] = useState<Record<string, HealthStatus | { error: string }>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      PROBES.map(async (p) => {
        try {
          const res = await fetch(p.url);
          const json = await res.json();
          return [p.label, HealthStatus.parse(json)] as const;
        } catch (err) {
          return [p.label, { error: (err as Error).message }] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) setResults(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>JobRadar</h1>
      <p>Phase 0 scaffold. Routing & UI land in Phase 1.</p>
      <h2>Health probes</h2>
      <ul>
        {PROBES.map((p) => (
          <li key={p.label}>
            <strong>{p.label}:</strong>{" "}
            <code>{JSON.stringify(results[p.label] ?? "loading...")}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
