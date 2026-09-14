import type { SessionData } from "@/types";

export const initialSession: SessionData = {
  currentWeekOffset: 0,
  currentDayOffset: 0,
  quickConfigGroup: null,
  watchType: "day",
  quickDate: "today",
  last: {
    quickConfigGroup: null,
    conversation: null,
  },
};
