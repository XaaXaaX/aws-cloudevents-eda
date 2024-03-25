import * as fs from "fs";
import YAML from 'yaml'
import arg from 'arg';
import * as path from "path"
import {
  FormatHelpers,
  TypeScriptGenerator, typeScriptDefaultEnumKeyConstraints
} from '@asyncapi/modelina';

const args = arg({
  '--spec-file-path': String, // --spec-file-path <string>
  '--dest-file-path': String, // --dest-file-path <string>
  '--with-additionalProperties': Boolean
});


if (!args?.["--spec-file-path"]) {
  console.log("Missing required argument: --spec-file-path");
  process.exit();
}

if (!args?.["--dest-file-path"]) {
  console.log("Missing required argument: --dest-file-path");
  process.exit();
}

const fileContent = fs.readFileSync(args?.["--spec-file-path"]).toString('utf-8');
const object = YAML.parse(fileContent);

const generator = new TypeScriptGenerator({
  modelType: 'interface',
  moduleSystem: 'ESM',
  enumType: "union",
  constraints: {
    enumKey: typeScriptDefaultEnumKeyConstraints({
      NAMING_FORMATTER: FormatHelpers.toPascalCase
    }),
  },
  presets: [
    {
      interface: {
        property: ({ content }) => {
          // modalina does not handle correctly additionalProperties 
          // here we remove it when --with-additionalProperties is provided 
          if (!args?.["--with-additionalProperties"] && content.startsWith('additionalProperties')) {
            return ''
          }
            
          // for some awkward decision made by modelina, when a property is called type, modelina prefixes it with reserved.
          // here we remove the preserved prefix from type property
          return content.replace('reservedType', 'type')
        }

      }
    }
  ]
});


(async () => {
  const models = await generator.generate(object);
  let fileContent = "";
  for (const model of models) {
    console.log(model)
    fileContent += 'export '.concat(model.result);
    fileContent += `\r\n`
    fileContent += " "
    fileContent += `\r\n`
  }

  const dir = path.parse(args?.["--dest-file-path"]!).dir;
  // ensure that the destination folder is created
  await fs.promises.mkdir(dir, { recursive: true});

  fs.writeFileSync(args?.["--dest-file-path"]!, fileContent, {
    encoding: 'utf-8'
  })

})();