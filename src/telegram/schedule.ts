export const DAY_NAMES_RU = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

export const getDayIndexForToday = (): number => {
  const day = new Date().getUTCDay();
  return (day + 6) % 7;
};

export const resolveDayOffset = (currentOffset: number): number => {
  const length = DAY_NAMES_RU.length;
  const currentIndex = getDayIndexForToday();

  return (((currentIndex + currentOffset) % length) + length) % length;
};
