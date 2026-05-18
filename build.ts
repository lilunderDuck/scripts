import { exec } from "child_process"

const moduleList = [
  "const_config",
  "mangle"
]

for (const moduleName of moduleList) {
  console.log("Building...", moduleName)
  exec(`bun build ./stuff/${moduleName}/src/main.ts --outfile ./dist/${moduleName}.js`, (error, stdout, stderr) => {
    if (error) {
      console.error(error)
    }
  })
}

console.log("Done")