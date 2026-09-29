import { LESSON_NUMBERS } from "@/constants";

export const parseLessonRange = (timeRange: string): number[] => {
  const [startTime, endTime] = timeRange.split(/\s*[-–—]\s*/);

  if (!startTime || !endTime) {
    throw new Error(`Некорректный диапазон времени: "${timeRange}"`);
  }

  const lessons = Object.entries(LESSON_NUMBERS)
    .map(([interval, number]) => {
      const [from, to] = interval.split("-").map((t) => t.trim());
      return { number, from, to };
    })
    .sort((a, b) => a.number - b.number);

  const startLesson = lessons.find((l) => l.from === startTime)?.number;
  const endLesson = lessons.find((l) => l.to === endTime)?.number;

  if (startLesson === undefined) {
    throw new Error(`Не найдено начало пары "${startTime}" в LESSON_NUMBERS`);
  }

  if (endLesson === undefined) {
    throw new Error(`Не найден конец пары "${endTime}" в LESSON_NUMBERS`);
  }

  if (startLesson > endLesson) {
    throw new Error(`Начало диапазона позже конца: "${timeRange}"`);
  }

  return lessons
    .filter(
      (lesson) => lesson.number >= startLesson && lesson.number <= endLesson,
    )
    .map((lesson) => lesson.number);
};
