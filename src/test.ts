import { AparkitSchedule } from "./classes/schedule/aparkit.schedule";

(async () => {
  const schedule = new AparkitSchedule();
  // const faculties = await schedule.api.getFaculties(); // ИСПО
  // const courses = await schedule.api.getCourses("ИСПО"); // 2
  // const specializations = await schedule.api.getSpecializations("ИСПО", "2"); // РЭУ
  // const groups = await schedule.api.getGroupsByFilter("ИСПО", "2", "РЭУ"); // РЭУ(ц)2225, id:9902758
  // await schedule.getWeeksSchedule(9902758);

  const weekNumber = await schedule.api.getCurrentWeek();
  const dayNumber = await schedule.api.getCurrentDay();

  const day = await schedule.getDaySchedule({
    groupId: 9902758,
    weekNumber,
    dayNumber,
  });
})();
