import { env } from "./env";

import { DriveReader } from "./drive.reader";
import { extractIdFromUrl } from "./utils";

(async () => {
  const reader = new DriveReader();

  const id = extractIdFromUrl(env.GOOGLE_DRIVE_FOLDER_URL);
  if (!id) {
    throw new Error("Bad URL");
  }

  const { files } = await reader.listFolder(id);
  
  console.log({files});
})();
