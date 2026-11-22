export const shortenTeacher = (name?: string) => {
  if (!name) return "";
  return name.replace(
    /([А-Яа-яЁё\-]+)\s+([А-Яа-яЁё])[А-Яа-яЁё]*\s+([А-Яа-яЁё])[А-Яа-яЁё]*/g,
    "$1 $2.$3.",
  );
};

export const shortenLessonType = (title: string) => {
  return title
    .replace(/\(Лабораторная работа\)/gi, "(Лаб.)")
    .replace(/\(Практика \(семинар\)\)/gi, "(Пр.)")
    .replace(/\(Лекция\)/gi, "(Лек.)")
    .replace(/\(Практика\)/gi, "(Пр.)");
};

export const shortenLocation = (loc: string) => {
  return loc
    .replace(/Учебный корпус ИСПО/gi, "УК ИСПО")
    .replace(/Мастерские ИСПО/gi, "Маст. ИСПО")
    .replace(/\(Ленина, 61, лит\. А2\)/gi, "(Ленина 61 А2)")
    .replace(/\(Ленина, 61, лит\. А4\)/gi, "(Ленина 61 А4)");
};
