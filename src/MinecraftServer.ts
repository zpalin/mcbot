import { ChildProcess, spawn } from "child_process"
import { JAVA_COMMAND, SERVER_ARGS, SERVER_COMMAND } from "./config"

export type MinecraftServerMessageHandler = (string) => void | Promise<void>

export class MinecraftServer {
  readonly server: ChildProcess
  private messageHandlers: Array<MinecraftServerMessageHandler> = []

  constructor() {
    this.server = spawn(JAVA_COMMAND, [...SERVER_ARGS, "-jar", SERVER_COMMAND, "--nogui"])
    this.setupHooks()
  }

  setupHooks() {
    this.server.stdout.on("data", (data) => {
      const message = data.toString()

      this.messageHandlers.forEach(handler => {
        handler(message)
      })

      console.log(`stdout: ${message}`)
    })

    process.stdin.pipe(this.server.stdin)

    this.server.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`)
    })

    this.server.on("error", (message) => {
      console.log("MC err:", message)
    })

    this.server.on("exit", (message) => {
      console.log("MC exit:", message)
      process.kill(0)
    })

    process.on("exit", () => {
      console.log("Shutting down server...")
      this.server.kill()
    })

    process.on("SIGINT", () => {
      console.log("SIGINT: Shutting down server...")
      this.server.kill()
    })
  }

  sendCommand(command: string) {
    this.server.stdin.write(`${command} \n`)
  }

  handleMessage(messageHandler: MinecraftServerMessageHandler) {
    this.messageHandlers.push(messageHandler)
  }

  kill() {
    this.server.kill()
  }
}
