import * as net from "net"

export type MinecraftServerMessageHandler = (string) => void | Promise<void>

export class MinecraftProxy {
  readonly client: net.Socket
  private messageHandlers: Array<MinecraftServerMessageHandler> = []

  constructor() {
    this.client = new net.Socket()
    this.setupHooks()
  }

  setupHooks() {
    this.client.on("data", (data) => {
      const message = data.toString()

      this.messageHandlers.forEach(handler => {
        handler(message)
      })

      console.log(`Proxy: ${message}`)
    })

    process.stdin.pipe(this.client)
  }

  async connect() {
    return new Promise((resolve) => {
      this.client.connect(1337, "127.0.0.1", () => {
        resolve()
      })
    })
  }

  sendCommand(command: string) {
    this.client.write(`${command} \n`)
  }

  handleMessage(messageHandler: MinecraftServerMessageHandler) {
    this.messageHandlers.push(messageHandler)
  }
}
