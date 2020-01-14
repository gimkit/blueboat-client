import ServerActions from '../lib/constants/ServerActions'
import Callback from './Callback'
import ClientActions from './constants/ClientActions'

class Room {
  public id: string
  public joined: boolean = false

  private socket: SocketIOClient.Socket
  private hasJoined: boolean = false

  public onCreate = new Callback()
  public onJoin = new Callback()
  public onMessage = new Callback()
  public onLeave = new Callback()
  public onError = new Callback()

  constructor(socket: SocketIOClient.Socket, roomId?: string) {
    if (roomId) {
      this.id = roomId
    }
    if (socket) {
      this.socket = socket
      if (roomId) {
        this.socketListener()
      }
    }
  }

  public _setRoomId(roomId: string) {
    this.id = roomId
    this.socketListener()
  }

  private socketListener() {
    const socket = this.socket
    socket.on(`${this.id}-error`, (e: any) => this.onError.call(e))
    socket.on(`message-${this.id}`, (d: { key: string; data?: any }) => {
      const { key, data } = d
      if (!key) {
        return
      }

      if (key === ServerActions.joinedRoom) {
        this.joined = true
        if (!this.hasJoined) {
          this.onJoin.call()
        }
        this.hasJoined = true
        return
      }

      if (key === ServerActions.removedFromRoom) {
        this.onLeave.call()
        this.joined = false
        return
      }

      this.onMessage.call(key, data)
      return
    })
  }

  public send = (key: string, data?: any) => {
    this.socket.emit(ClientActions.sendMessage, { room: this.id, key, data })
  }
}

export default Room
