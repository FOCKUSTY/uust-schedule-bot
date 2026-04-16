export interface SessionData {
  registration?: {
    step: 'course' | 'specialization' | 'group';
    course?: string;
    specialization?: string;
  };
  currentWeekOffset?: number;
  lastBotMessageId?: number;
  lastChatId?: number;
}

export function initialSession(): SessionData {
  return {
    currentWeekOffset: 0,
  };
}