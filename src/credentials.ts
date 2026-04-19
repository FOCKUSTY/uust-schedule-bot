import { env } from "./env";

import { CREDENTIALS_JSON_FILE } from "./schedule/google";

import { writeFileSync } from "fs";
import { join } from "path";

writeFileSync(join(process.cwd(), CREDENTIALS_JSON_FILE), env.GOOGLE_CREDENTIALS, "utf-8");
