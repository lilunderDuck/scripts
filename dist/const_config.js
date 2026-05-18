// stuff/logging.ts
var RESET = "\x1B[0m";
var FG_RED = "\x1B[31m";
var FG_YELLOW = "\x1B[33m";
function warnLog(...something) {
  console.error(`${FG_YELLOW}warn${RESET}:`, ...something);
}
function panic(...something) {
  console.error(`${FG_RED}panic${RESET}:`, ...something);
  process.exit(1);
}
function panicThenShowFormatedObject(someObject, ...something) {
  console.error(`${FG_RED}panic${RESET}:`, ...something);
  console.log("Your config:", JSON.stringify(someObject, null, 2));
  process.exit(1);
}

// stuff/const_config/src/validate.ts
function isPlainObject(val) {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}
function mustNotBeEmptyObject(val) {
  if (!isPlainObject(val)) {
    panicThenShowFormatedObject(val, "Value is not an object");
  }
  if (Object.keys(val).length === 0) {
    panicThenShowFormatedObject(val, "Value is an empty object");
  }
}
function requiresTheseProps(object, requiredPropMap) {
  for (const [prop, propType] of Object.entries(requiredPropMap)) {
    if (object[prop] === undefined || object[prop] === null) {
      panic(`Missing property: "${prop}"`);
    }
    if (Array.isArray(propType)) {
      continue;
    }
    if (typeof object[prop] !== propType) {
      if (propType === "any")
        continue;
      panic(`Expected property "${prop}" have ${propType} type, but got ${typeof object[prop]}`);
    }
  }
}

// stuff/const_config/src/utils.ts
var {mkdirSync, readFileSync, writeFileSync} = (() => ({}));
var GLOBAL = {
  mapping: [],
  definedMapping: new Map,
  fileContent: `// this file is auto-generated when on dev/build mode
`
};
function addToMapping(name, value) {
  GLOBAL.definedMapping.set(name, value);
  console.log(`Define:		${name} = ${value}`);
}
function appendContent(something) {
  GLOBAL.fileContent += something;
}
function readConfigFile() {
  return JSON.parse(readFileSync("./consts_config.json", {
    encoding: "utf-8"
  }));
}
function saveTypeDef() {
  mkdirSync("./build/dist", { recursive: true });
  writeFileSync("./build/dist/consts.d.ts", `declare global {
	${GLOBAL.fileContent}
}; export {}`);
}

// stuff/const_config/src/main.ts
function generateConstEnums(config) {
  let entries = Object.entries(config.members);
  if (Array.isArray(config.members)) {
    const propMapping = {};
    for (let i = 0;i < config.members.length; i++) {
      const propName = config.members[i];
      propMapping[propName] = i;
    }
    entries = Object.entries(propMapping);
  }
  const enumName = config.name;
  let enumContent = "";
  for (let [enumPropName, enumPropValue] of entries) {
    if (typeof enumPropValue === "string") {
      enumPropValue = `"${enumPropValue}"`;
    }
    enumContent += `	${enumPropName} = ${enumPropValue},
`;
    addToMapping(`${enumName}.${enumPropName}`, enumPropValue);
  }
  appendContent(`enum ${enumName} {
${enumContent}
}`);
}
function generateConsts(config) {
  appendContent(`declare const ${config.name}: ${config.value};
`);
  addToMapping(config.name, config.value);
}
function generateTypeThenSave() {
  const configFile = readConfigFile();
  for (const config of configFile) {
    painfullyValidateThese(config);
    switch (config.type) {
      case "enum":
        generateConstEnums(config);
        break;
      case "const":
        generateConsts(config);
        break;
      default:
        warnLog(`Found unsupported type: "${config.type}", its type definition will not be generated.`);
        break;
    }
  }
  saveTypeDef();
  console.log("Done");
}
function painfullyValidateThese(config) {
  mustNotBeEmptyObject(config);
  switch (config.type) {
    case "const":
      requiresTheseProps(config, {
        type: "string",
        name: "string",
        value: "any"
      });
      break;
    case "enum":
      requiresTheseProps(config, {
        members: ["array", "object"],
        name: "string",
        type: "string"
      });
      break;
  }
}
if (import.meta.main) {
  generateTypeThenSave();
}
export {
  generateTypeThenSave
};
