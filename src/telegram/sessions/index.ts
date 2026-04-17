export interface SessionData {
  registration?: {
    step: 'course' | 'specialization' | 'group';
    course?: string;
    specialization?: string;
  };
  currentWeekOffset?: number;
}

export function initialSession(): SessionData {
  return {
    currentWeekOffset: 0,
  };
}