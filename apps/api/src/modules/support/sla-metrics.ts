export const RESPONSE_SLA_HOURS = 4;
export const RESOLUTION_SLA_HOURS = 24;

export interface SlaTicketRecord {
  status: string;
  createdAt: Date;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
}

export function calculateSlaMetrics(tickets: SlaTicketRecord[], now = new Date()) {
  const responseTargetMs = RESPONSE_SLA_HOURS * 60 * 60 * 1000;
  const resolutionTargetMs = RESOLUTION_SLA_HOURS * 60 * 60 * 1000;
  const responseDeadline = now.getTime() - responseTargetMs;
  const resolutionDeadline = now.getTime() - resolutionTargetMs;

  const responseEligible = tickets.filter((ticket) =>
    ticket.firstResponseAt !== null || ticket.createdAt.getTime() <= responseDeadline,
  );
  const resolutionEligible = tickets.filter((ticket) =>
    ticket.resolvedAt !== null || ticket.createdAt.getTime() <= resolutionDeadline,
  );
  const responseTimes = tickets.flatMap((ticket) => ticket.firstResponseAt
    ? [(ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()) / 60_000]
    : []);
  const resolutionTimes = tickets.flatMap((ticket) => ticket.resolvedAt
    ? [(ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / 60_000]
    : []);
  const resolved = tickets.filter((ticket) => ticket.resolvedAt !== null);
  const active = tickets.filter((ticket) => !["resolved", "closed"].includes(ticket.status));
  const responseWithinSla = responseEligible.filter((ticket) =>
    ticket.firstResponseAt !== null &&
    ticket.firstResponseAt.getTime() - ticket.createdAt.getTime() <= responseTargetMs,
  ).length;
  const resolutionWithinSla = resolutionEligible.filter((ticket) =>
    ticket.resolvedAt !== null &&
    ticket.resolvedAt.getTime() - ticket.createdAt.getTime() <= resolutionTargetMs,
  ).length;

  return {
    total: tickets.length,
    active: active.length,
    resolved: resolved.length,
    responseTargetHours: RESPONSE_SLA_HOURS,
    resolutionTargetHours: RESOLUTION_SLA_HOURS,
    responseSlaEligible: responseEligible.length,
    responseSlaMet: responseWithinSla,
    responseSlaPercent: responseEligible.length ? (responseWithinSla / responseEligible.length) * 100 : null,
    resolutionSlaEligible: resolutionEligible.length,
    resolutionSlaMet: resolutionWithinSla,
    resolutionSlaPercent: resolutionEligible.length ? (resolutionWithinSla / resolutionEligible.length) * 100 : null,
    averageFirstResponseMinutes: responseTimes.length
      ? responseTimes.reduce((total, minutes) => total + minutes, 0) / responseTimes.length
      : null,
    averageResolutionMinutes: resolutionTimes.length
      ? resolutionTimes.reduce((total, minutes) => total + minutes, 0) / resolutionTimes.length
      : null,
    responseSlaBreaches: responseEligible.length - responseWithinSla,
    resolutionSlaBreaches: resolutionEligible.length - resolutionWithinSla,
  };
}
