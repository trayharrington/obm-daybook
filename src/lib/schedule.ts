export const defaultRules = {
  welcomeAfterStartDays: 0, // R6
  reminderIntervalDays: 3, // R7
  planPostKickoffDays: 1, // R6
  planPostWaivedKickoffDays: 1, // R21
  noShowOutreachDays: 1, // R20
  toolsPostPlanDays: 7, // R6
  handoffPostToolsDays: 7, // R6
  quietCheckInDays: 7, // R22
  escalateAfterReminders: 2, // R7, R9
  yellowAtDaysOverdue: 1, // R9
  redAtDaysOverdue: 4 // R9
} as const

export function todayInChicago(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const updatedDate = new Date(Date.UTC(year, month - 1, day + days));
  return updatedDate.toISOString().slice(0, 10);
}
