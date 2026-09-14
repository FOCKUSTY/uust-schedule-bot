import { AparkitSchedule } from "./classes/schedule/aparkit.schedule";
import { DateCalculator } from "./telegram/utils/date-calculator";

(async () => {
  const schedule = new AparkitSchedule();
  // const faculties = await schedule.api.getFaculties(); // ИСПО
  // const courses = await schedule.api.getCourses("ИСПО"); // 2
  // const specializations = await schedule.api.getSpecializations("ИСПО", "2"); // РЭУ
  const groups = await schedule.api.getGroupsByFilter("ИСПО", "2", "РЭУ"); // РЭУ(ц)2225, id:9913658
  await schedule.getWeeksSchedule(9913658);
  // console.log(groups);

  const weekNumber = await schedule.api.getCurrentWeek();
  const dayNumber = await schedule.api.getCurrentDay();

  const weeks = await schedule.getWeeksSchedule(9913658);
  const day = await schedule.getDaySchedule({
    groupId: 9913658,
    weekNumber,
    dayNumber,
  });

  console.dir({ /* weeks, */ day }, { depth: Infinity });
})();
