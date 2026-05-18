import { panic, panicThenShowFormatedObject } from "../../logging"


export function isPlainObject(val: any) {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

export function mustNotBeEmptyObject(val: any) {
  if (!isPlainObject(val)) {
    panicThenShowFormatedObject(val, "Value is not an object")
  }

  if (Object.keys(val).length === 0) {
    panicThenShowFormatedObject(val, "Value is an empty object")
  }
}

type PropType = "string" | "number" | "object" | "array" | "any"
type AnyObject = Record<string, any>

export function requiresTheseProps<T extends AnyObject>(
  object: AnyObject, 
  requiredPropMap: Record<keyof T, PropType | PropType[]>
) {
  for (const [prop, propType] of Object.entries(requiredPropMap)) {
    if (object[prop] === undefined || object[prop] === null) {
      panic(`Missing property: "${prop}"`)
    }

    if (Array.isArray(propType)) {
      continue
    }

    if (typeof object[prop] !== propType) {
      if (propType === "any") continue // skip
      panic(`Expected property "${prop}" have ${propType} type, but got ${typeof object[prop]}`)
    }
  }
}