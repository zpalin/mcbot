import * as net from "net"
import { MinecraftServer } from "./MinecraftServer"


async function main() {
  const minecraft = new MinecraftServer()

  const server = net.createServer((socket) => {
    console.log("Client connected.")

    socket.on("data", (message) => {
      minecraft.server.stdin.write(message)
    })

    function dataHandler(data) {
      if (socket && !socket.destroyed) {
        socket.write(data)
      } else {
        console.log("Trying to write to closed socket.")
      }
    }

    minecraft.server.stdout.on("data", dataHandler)

    socket.on("close", () => {
      minecraft.server.stdout.removeListener("data", dataHandler)
      console.log("Client closed.")
    })
  })

  server.listen(1337, "127.0.0.1")
}

main().catch((err) => {
  console.error(`Error caught: ${err}`)
  process.kill(1)
})
