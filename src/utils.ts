import { env } from "./env"

export const getCurrentWeek = () => {
  const target = new Date();
  target.setHours(0, 0, 0, 0);

  const start = new Date(env.START_DATE.getTime());
  start.setHours(0, 0, 0, 0);

  if (target < start) {
    return 0;
  }

  const difference = target.getTime() - start.getTime();
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(days / 7);

  return weekNumber;
}

const TWO_HOURS = 1000 * 60 * 60 * 2;

export const getExpiresAtTimeForCache = () => {
  const now = new Date().getTime();
  const expiresAt = now + TWO_HOURS;

  return new Date(expiresAt).toISOString();
}