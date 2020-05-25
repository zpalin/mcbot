import { ChildProcess, spawn } from "child_process";
import * as Discord from "discord.js";
import { Message, TextChannel } from "discord.js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

export function getOrThrow<T>(value: T | undefined, message?: string): T {
  if (value) {
    return value;
  }

  throw new Error(message || "Unexpected undefined value");
}


const MC_SERVER_DIRECTORY = getOrThrow(process.env.MC_SERVER_DIRECTORY, "Missing MC_SERVER_DIRECTORY");
process.chdir(MC_SERVER_DIRECTORY);

const JAVA_COMMAND = process.env.JAVA_COMMAND || "java";
const SERVER_COMMAND = process.env.SERVER_COMMAND || "./forge-1.15.2-31.1.37.jar";
const SERVER_ARGS = process.env.SERVER_ARGS.split(" ") || [];

const DISCORD_TOKEN = getOrThrow(process.env.DISCORD_TOKEN, "Missing DISCORD_TOKEN");
const DISCORD_MC_CHANNEL_ID = getOrThrow(process.env.DISCORD_MC_CHANNEL_ID, "Missing DISCORD_MC_CHANNEL_ID");

type MinecraftServerMessageHandler = (string) => void | Promise<void>

class MinecraftServer {
  private server: ChildProcess;
  private messageHandlers: Array<MinecraftServerMessageHandler> = [];

  constructor() {
    this.server = spawn(JAVA_COMMAND, [...SERVER_ARGS, "-jar", SERVER_COMMAND, "--nogui"]);
    this.setupHooks();
  }

  setupHooks() {
    this.server.stdout.on("data", (data) => {
      const message = data.toString();

      this.messageHandlers.forEach(handler => {
        handler(message);
      });

      console.log(`stdout: ${message}`);
    });

    process.stdin.pipe(this.server.stdin);

    this.server.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`);
    });

    this.server.on("error", (message) => {
      console.log("MC err:", message);
    });

    this.server.on("exit", (message) => {
      console.log("MC exit:", message);
      process.kill(0);
    });

    process.on("exit", () => {
      console.log("Shutting down server...");
      this.server.kill();
    });

    process.on("SIGINT", () => {
      console.log("SIGINT: Shutting down server...");
      this.server.kill();
    });
  }

  sendCommand(command: string) {
    this.server.stdin.write(`${command} \n`);
  }

  handleMessage(messageHandler: MinecraftServerMessageHandler) {
    this.messageHandlers.push(messageHandler);
  }

  kill() {
    this.server.kill();
  }
}

// function showPrompt(query): Promise<string> {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });
//
//   return new Promise(resolve => rl.question(query, ans => {
//     rl.close();
//     resolve(ans);
//   }));
// }

type WhitelistItem = {
  uuid: string
  name: string
}

async function main() {
  const whitelistJson = fs.readFileSync(path.join(MC_SERVER_DIRECTORY, "whitelist.json"));
  const whitelist = JSON.parse(whitelistJson.toString()) as Array<WhitelistItem>;
  console.log(whitelist);

  const client = new Discord.Client();
  await client.login(DISCORD_TOKEN);
  const minecraftChannel = await client.channels.fetch(DISCORD_MC_CHANNEL_ID) as TextChannel;

  if (!minecraftChannel || minecraftChannel.type !== "text") {
    throw new Error("Error loading channel");
  }

  console.log("Starting server...");
  const minecraft = new MinecraftServer();

  client.on("message", (msg: Message) => {
    const { channel, content, author } = msg;
    if (author.username === "Minecraft Bot") return;

    if (channel.type === "text" && channel.name === minecraftChannel.name) {
      console.log(`<${author.username}> ${content}`);
      minecraft.sendCommand(`/say <${author.username}> ${content}`);
    }
  });


  minecraft.handleMessage((message: string) => {
    const match = message.match(/[minecraft\/DedicatedServer]]: <.+>/);
    if (match) {
      let parsedMessage = message.slice((match?.index || 0) + 3)
        .replace(/[\n\r]+/g, "")
        .trim();
      parsedMessage = parsedMessage.slice(0, parsedMessage.length - 3);
      minecraftChannel.send(parsedMessage);
    }
  });

  minecraft.handleMessage((message: string) => {
    const match = message.match(new RegExp(/[minecraft\/DedicatedServer]]: (.+) joined the game/));
    if (match) {
      const playerName = match[1];
      minecraftChannel.send(`${playerName} has joined the game.`);
    }
  });

  minecraft.handleMessage((message: string) => {
    const match = message.match(new RegExp(/[minecraft\/DedicatedServer]]: (.+) left the game/));
    if (match) {
      const playerName = match[1];
      minecraftChannel.send(`${playerName} has left the game.`);
    }
  });
}

main().catch((err) => {
  console.error(`Exiting with error: ${err}`);
});




