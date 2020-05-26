import * as Discord from "discord.js"
import { Message, TextChannel } from "discord.js"
import { DISCORD_MC_CHANNEL_ID, DISCORD_TOKEN } from "./config"
import { MinecraftProxy } from "./MinecraftProxy"


async function main() {
  const discord = new Discord.Client()
  await discord.login(DISCORD_TOKEN)
  const minecraftChannel = await discord.channels.fetch(DISCORD_MC_CHANNEL_ID) as TextChannel

  if (!minecraftChannel || minecraftChannel.type !== "text") {
    throw new Error("Error loading channel")
  }

  console.log("Starting server...")
  const minecraft = new MinecraftProxy()
  await minecraft.connect()

  discord.on("message", (msg: Message) => {
    const { channel, content, author } = msg
    if (author.username === "Minecraft Bot") return

    if (channel.type === "text" && channel.name === minecraftChannel.name) {
      console.log(`<${author.username}> ${content}`)
      minecraft.sendCommand(`/say <${author.username}> ${content}`)
    }
  })

  minecraft.handleMessage((message: string) => {
    const match = message.match(/[minecraft\/DedicatedServer]]: <.+>/)
    if (match) {
      let parsedMessage = message.slice((match?.index || 0) + 3)
        .replace(/[\n\r]+/g, "")
        .trim()
      parsedMessage = parsedMessage.slice(0, parsedMessage.length - 3)
      minecraftChannel.send(parsedMessage)
    }
  })

  minecraft.handleMessage((message: string) => {
    const match = message.match(new RegExp(/[minecraft\/DedicatedServer]]: (.+) joined the game/))
    if (match) {
      const playerName = match[1]
      minecraftChannel.send(`${playerName} has joined the game.`)
    }
  })

  minecraft.handleMessage((message: string) => {
    const match = message.match(new RegExp(/[minecraft\/DedicatedServer]]: (.+) left the game/))
    if (match) {
      const playerName = match[1]
      minecraftChannel.send(`${playerName} has left the game.`)
    }
  })
}

main().catch((err) => {
  console.error(`Exiting with error: ${err}`)
})




