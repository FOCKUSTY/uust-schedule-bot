export interface SessionData {
  registration?: {
    step: 'course' | 'specialization' | 'group';
    course?: string;
    specialization?: string;
  };
  watchType: "day"|"week";
  currentWeekOffset: number;
  currentDayOffset: number;
  lastBotMessageId?: number;
  lastChatId?: number;
}

export function initialSession(): SessionData {
  return {
    currentWeekOffset: 0,
    currentDayOffset: 0,
    watchType: "day"
  };
}