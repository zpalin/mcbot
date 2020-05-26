import * as dotenv from "dotenv"
import { getOrThrow } from "./utils"

dotenv.config()


export const MC_SERVER_DIRECTORY = getOrThrow(process.env.MC_SERVER_DIRECTORY, "Missing MC_SERVER_DIRECTORY")

process.chdir(MC_SERVER_DIRECTORY)

export const JAVA_COMMAND = process.env.JAVA_COMMAND || "java"
export const SERVER_COMMAND = process.env.SERVER_COMMAND || "./forge-1.15.2-31.1.37.jar"
export const SERVER_ARGS = process.env.SERVER_ARGS.split(" ") || []
export const DISCORD_TOKEN = getOrThrow(process.env.DISCORD_TOKEN, "Missing DISCORD_TOKEN")
export const DISCORD_MC_CHANNEL_ID = getOrThrow(process.env.DISCORD_MC_CHANNEL_ID, "Missing DISCORD_MC_CHANNEL_ID")
