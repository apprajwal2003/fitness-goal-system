export interface TimeRange {
  start: string; // "HH:mm"
  end: string;
}

export interface BusySlot {
  start: string;
  end: string;
  label?: string;
}

export interface ActivityToSchedule {
  type: 'meal' | 'workout' | 'snack';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  durationMinutes: number;
  name?: string;
  preferredOrder?: number; // lower = earlier
  /** Preferred time window in minutes from midnight — scheduler tries to place here first */
  preferredStartMin?: number;
}

export interface ScheduledActivityResult {
  type: 'meal' | 'workout' | 'snack';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  start: string;
  end: string;
  name?: string;
}

export interface DayConstraints {
  /** Blocked time ranges for this day (work, recurring routine, user busy slots) */
  blockedRanges: TimeRange[];
  /** Minimum gap in minutes between meals */
  mealGapMinutes: number;
  /** Day boundary: earliest activity (e.g. 6am = 360) */
  dayStartMinutes: number;
  /** Day boundary: latest activity end (e.g. 22:00 = 1320) */
  dayEndMinutes: number;
}

export interface SchedulerInput {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sunday
  activities: ActivityToSchedule[];
  constraints: DayConstraints;
}

export interface SchedulerResult {
  scheduled: ScheduledActivityResult[];
  unscheduled: ActivityToSchedule[];
  feasible: boolean;
}
