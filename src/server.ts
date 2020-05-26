import * as net from "net"
import { MinecraftServer } from "./MinecraftServer"


async function main() {
  const minecraft = new MinecraftServer()

  const server = net.createServer((socket) => {
    console.log("Socket connected.")

    socket.on("data", (message) => {
      minecraft.server.stdin.write(message)
    })

    minecraft.server.stdout.on("data", (message) => {
      socket.write(message)
    })

    socket.on("close", () => {
      console.log("Socket closed.")
    })
  })

  server.listen(1337, "127.0.0.1")
}

main().catch((err) => {
  console.error(`Error caught: ${err}`)
  process.kill(1)
})
