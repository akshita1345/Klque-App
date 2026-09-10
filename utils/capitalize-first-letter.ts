import { upperFirst } from "lodash"

export const capitalizeFirstLetter = (str: string) => upperFirst(str?.trim())