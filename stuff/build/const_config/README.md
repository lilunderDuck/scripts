## About this
A json config file that try mimicking the behaviour of typescript's `const enum`.

All you have to do is create a `consts_config.json` in the project root and after running `vite`, it'll literally inline the value of an enum member like `Duck.ALIVE` into `0`.

## Why?
This is a workaround, because of the fact that `vite` (and maybe other build tools?) does not support inline const enum for some reason.

That means if you have a const enum like this
```ts
const enum Duck {
  ALIVE,
  BEING_EATEN
}

// do something with that enum
const result = Duck.ALIVE
console.log(isBeingEaten(result))
```

`vite` will transpile to something like this
```ts
var Duck;
(function (Duck) {
  Duck[Duck["ALIVE"] = 0] = "ALIVE";
  Duck[Duck["BEING_EATEN"] = 1] = "BEING_EATEN";
})(Duck || (Duck = {}));

var result = Duck.ALIVE;
console.log(isBeingEaten(result));
```

Instead of this
```ts
var result = 0 // <- the enum value is inlined
console.log(isBeingEaten(result))
```

See the following for more info:
- https://github.com/evanw/esbuild/issues/128
- https://stackoverflow.com/a/74129989

## Usage
First, copy the typescript file and paste it somewhere inside your project, it might be look like this
```
(root project)
|  scripts
|  |  const_config.ts  
|  src
|  |  ...
|  vite.config.ts
|  consts_config.json
```

Then import the script to `vite.config.ts`
```ts
export default defineConfig(({ command }) => {
  const IS_DEBUG = command !== "build"

  return {
    plugins: [
      constConfigPlugin(IS_DEBUG)
    ],
  }
})
```

Next is to create `consts_config.json` inside your root directory. Example config looks like this.
```ts
[
  {
    "type": "enum",
    "name": "Position",
    "members": ["LEFT", "CENTER", "RIGHT"]
  },
  {
    "type": "const",
    "name": "DEFAULT_ID",
    "value": 1337
  }
]
```

Starting vite by running `vite` and you're good to go.