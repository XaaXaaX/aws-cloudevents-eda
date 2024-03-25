import { Parser, fromFile, fromURL } from "@asyncapi/parser";
import arg from "arg";
import * as fs from "fs";
import * as path from "path"

const args = arg({
  '--spec-file-path': String, // --spec-file-path <string>
  '--dest-file-path': String, // --dest-file-path <string>
});


if (!args?.["--spec-file-path"]) {
  console.log("Missing required argument: --spec-file-path");
  process.exit();
}

if (!args?.["--dest-file-path"]) {
  console.log("Missing required argument: --dest-file-path");
  process.exit();
}


(async () => {

  const asyncapiParser = new Parser();
  const parseOutput = (args?.["--spec-file-path"]?.startsWith('https') || args?.["--spec-file-path"]?.startsWith("http")) ?
    await fromURL(asyncapiParser, args?.["--spec-file-path"]!).parse() :
    await fromFile(asyncapiParser, args?.["--spec-file-path"]!).parse();

  const schema = parseOutput.document?.json() ?? {};
  const fileContent = `export const schema=${JSON.stringify(schema, null, 2)}`

  const dir = path.parse(args?.["--dest-file-path"]!).dir;
  // ensure that the destination folder is created
  await fs.promises.mkdir(dir, { recursive: true});

  fs.writeFileSync(args?.["--dest-file-path"]!, fileContent, 'utf-8');

})();

