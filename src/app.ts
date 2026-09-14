import { env } from "./env";
import { bot } from "./telegram/bot";

import express from "express";

const app = express();

app.get("/", (request, response) => {
  console.log("Ping from", request.hostname);
  return response.send(
    JSON.stringify(
      {
        id: bot.botInfo.id,
        username: bot.botInfo.username,
      },
      undefined,
      2,
    ),
  );
});

app.get("/ping", (request, response) => {
  return response.send("Pong!");
});

export const listen = () => {
  return app.listen(env.PORT, () => {
    console.log(`Example app listening on port ${env.PORT}`);
  });
};
