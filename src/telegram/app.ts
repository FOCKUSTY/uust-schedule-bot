import { env } from "../env";
import { Schedule } from "../schedule";

import { bot } from "./bot";

import express from "express";

const app = express();

app.get('/', (request, response) => {
  console.log("Ping from", request.hostname);
  return response.send(JSON.stringify({
    id: bot.botInfo.id,
    username: bot.botInfo.username
  }, undefined, 2));
});

app.get("/:course/:specialization/:group/:week", async (request, response) => {
  try {
    const { course, specialization, group, week } = request.params;
  
    const schedule = new Schedule({
      course,
      group,
      specialization
    }, Number(week));
  
    const scheduleWeek = await schedule.getWeekSchedule();
    
    return response.send(JSON.stringify(scheduleWeek.days, undefined, 2));
  } catch {
    return response.status(500);
  }
});

export const listen = () => {
  return app.listen(env.PORT, () => {
    console.log(`Example app listening on port ${env.PORT}`);
  });
}
