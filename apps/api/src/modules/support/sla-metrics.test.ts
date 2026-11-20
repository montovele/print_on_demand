import { describe, expect, it } from "vitest";
import { calculateSlaMetrics } from "./sla-metrics.js";

describe("calculateSlaMetrics", () => {
  const now = new Date("2026-11-10T12:00:00.000Z");

  it("measures response and resolution compliance against the configured targets", () => {
    const metrics = calculateSlaMetrics([
      {
        status: "resolved",
        createdAt: new Date("2026-11-09T12:00:00.000Z"),
        firstResponseAt: new Date("2026-11-09T14:00:00.000Z"),
        resolvedAt: new Date("2026-11-10T10:00:00.000Z"),
      },
      {
        status: "in_progress",
        createdAt: new Date("2026-11-10T06:00:00.000Z"),
        firstResponseAt: new Date("2026-11-10T11:00:00.000Z"),
        resolvedAt: null,
      },
    ], now);

    expect(metrics.total).toBe(2);
    expect(metrics.active).toBe(1);
    expect(metrics.resolved).toBe(1);
    expect(metrics.responseSlaPercent).toBe(50);
    expect(metrics.resolutionSlaPercent).toBe(100);
    expect(metrics.responseSlaBreaches).toBe(1);
    expect(metrics.resolutionSlaBreaches).toBe(0);
    expect(metrics.averageFirstResponseMinutes).toBe(210);
    expect(metrics.averageResolutionMinutes).toBe(1320);
  });

  it("excludes tickets that have not yet reached an SLA deadline", () => {
    const metrics = calculateSlaMetrics([{
      status: "open",
      createdAt: new Date("2026-11-10T11:00:00.000Z"),
      firstResponseAt: null,
      resolvedAt: null,
    }], now);

    expect(metrics.responseSlaPercent).toBeNull();
    expect(metrics.resolutionSlaPercent).toBeNull();
    expect(metrics.responseSlaBreaches).toBe(0);
    expect(metrics.resolutionSlaBreaches).toBe(0);
  });
});
