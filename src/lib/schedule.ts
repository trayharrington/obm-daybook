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
