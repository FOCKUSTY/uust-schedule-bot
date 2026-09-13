export interface SessionData {
  registration?: {
    step: "faculty" | "course" | "specialization" | "group";
    course?: string;
    faculty?: string;
    specialization?: string;
  };
  last: {
    conversation: string | null;
    quickConfigGroup: string | null;
  };
  watchType: "day" | "week";
  quickConfigGroup: string | null;
  quickDate: "none" | "today" | "tomorrow";
  currentWeekOffset: number;
  currentDayOffset: number;
  lastBotMessageId?: number;
  lastChatId?: number;
}
