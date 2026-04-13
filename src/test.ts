import { DriveReader } from "./drive.reader";
import { extractIdFromUrl } from "./utils";

(async () => {
  const reader = new DriveReader();

  const id = extractIdFromUrl("https://drive.google.com/drive/folders/1lt1vchyAWuJUdxXS-htNrKsnd_IstWD0");
  if (!id) {
    throw new Error("Bad URL");
  }

  const { files } = await reader.listFolder(id);
  
  console.log({files});
})();