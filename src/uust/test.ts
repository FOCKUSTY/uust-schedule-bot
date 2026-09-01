import { ScheduleSearch } from './search';

async function main() {
  const searcher = new ScheduleSearch();

  const groups = await searcher.searchGroups('РЭУ');
  console.log({groups});

  const groupId = await searcher.findGroupIdByName('РЭУ(ц)2225(2)');
  console.log({groupId});

  const teachers = await searcher.searchTeachers('Гизатуллина');
  console.log({teachers});

  const rooms = await searcher.searchClassrooms('311');
  console.log({rooms});
}

main();