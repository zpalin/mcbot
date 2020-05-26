import * as fs from "fs"
import * as path from "path"
import { promisify } from "util"
import { MC_SERVER_DIRECTORY } from "./config"

export type WhitelistItem = {
  uuid: string
  name: string
}

export async function getWhitelist(): Promise<Array<WhitelistItem>> {
  const whitelistJson = await promisify(fs.readFile)(path.join(MC_SERVER_DIRECTORY, "whitelist.json"))
  return JSON.parse(whitelistJson.toString()) as Array<WhitelistItem>
}
